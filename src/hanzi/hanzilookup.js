import AnalyzedCharacter from './classes/AnalyzedCharacter'
import AnalyzedStroke from './classes/AnalyzedStroke'
import CharacterMatch from './classes/CharacterMatch'
import CubicCurve2D from './classes/CubicCurve2D'
import DrawingBoard from './classes/DrawingBoard'
import StrokeInputOverlay from './classes/StrokeInputOverlay'
import MatchCollector from './classes/MatchCollector'

const HanziLookup = {}

HanziLookup.options = {
  drawingGrid: true,
  strokeColor: 'black'
}
HanziLookup.AnalyzedStroke = AnalyzedStroke
HanziLookup.AnalyzedCharacter = AnalyzedCharacter
HanziLookup.CharacterMatch = CharacterMatch
HanziLookup.CubicCurve2D = CubicCurve2D

HanziLookup.decodeCompact = function (base64) {
  'use strict'
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let lookup = new Uint8Array(256)
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i
  }
  let bufferLength = base64.length * 0.75
  let len = base64.length
  let p = 0
  let encoded1
  let encoded2
  let encoded3
  let encoded4
  if (base64[base64.length - 1] === '=') {
    bufferLength--
    if (base64[base64.length - 2] === '=') {
      bufferLength--
    }
  }
  let arraybuffer = new ArrayBuffer(bufferLength)
  let bytes = new Uint8Array(arraybuffer)
  for (let i = 0; i < len; i += 4) {
    encoded1 = lookup[base64.charCodeAt(i)]
    encoded2 = lookup[base64.charCodeAt(i + 1)]
    encoded3 = lookup[base64.charCodeAt(i + 2)]
    encoded4 = lookup[base64.charCodeAt(i + 3)]
    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4)
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2)
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63)
  }
  return bytes
}

HanziLookup.DrawingBoard = DrawingBoard

HanziLookup.data = {}
HanziLookup.init = function (key, data) {
  if (!HanziLookup.data[key]) {
    HanziLookup.data[key] = data
    HanziLookup.data[key].substrokes = HanziLookup.decodeCompact(data.substrokes)
  }
}

HanziLookup.MatchCollector = MatchCollector

// Magic constants
HanziLookup.MAX_CHARACTER_STROKE_COUNT = 48
HanziLookup.MAX_CHARACTER_SUB_STROKE_COUNT = 64
HanziLookup.DEFAULT_LOOSENESS = 0.15
HanziLookup.AVG_SUBSTROKE_LENGTH = 0.33 // an average length (out of 1)
HanziLookup.SKIP_PENALTY_MULTIPLIER = 1.75 // penalty mulitplier for skipping a stroke
HanziLookup.CORRECT_NUM_STROKES_BONUS = 0.1 // max multiplier bonus if characters has the correct number of strokes
HanziLookup.CORRECT_NUM_STROKES_CAP = 10 // characters with more strokes than this will not be multiplied

class Matcher {
  constructor (dataName, looseness) {
    this._looseness = looseness || HanziLookup.DEFAULT_LOOSENESS
    this._repo = HanziLookup.data[dataName].chars
    this._sbin = HanziLookup.data[dataName].substrokes
    this._scoreMatrix = this._buildScoreMatrix()
    this._charsChecked = 0
    this._subStrokesCompared = 0
    this.DIRECTION_SCORE_TABLE = null
    this.LENGTH_SCORE_TABLE = null
    this.POS_SCORE_TABLE = null
    this._initScoreTables()
  }

  match (inputChar, limit, ready) {
    this._charsChecked = 0
    this._subStrokesCompared = 0
    let matchCollector = new HanziLookup.MatchCollector(limit)
    if (inputChar.analyzedStrokes.length == 0) {
      return matchCollector.getMatches()
    }
    let inputSubStrokes = []
    for (let i = 0; i != inputChar.analyzedStrokes.length; ++i) {
      let stroke = inputChar.analyzedStrokes[i]
      for (let j = 0; j != stroke.subStrokes.length; ++j) {
        inputSubStrokes.push(stroke.subStrokes[j])
      }
    }
    let strokeCount = inputChar.analyzedStrokes.length
    let subStrokeCount = inputChar.subStrokeCount
    let strokeRange = this._getStrokesRange(strokeCount)
    let minimumStrokes = Math.max(strokeCount - strokeRange, 1)
    let maximumStrokes = Math.min(strokeCount + strokeRange, HanziLookup.MAX_CHARACTER_STROKE_COUNT)
    let subStrokesRange = this._getSubStrokesRange(subStrokeCount)
    let minSubStrokes = Math.max(subStrokeCount - subStrokesRange, 1)
    let maxSubStrokes = Math.min(subStrokeCount + subStrokesRange, HanziLookup.MAX_CHARACTER_SUB_STROKE_COUNT)
    for (let cix = 0; cix != this._repo.length; ++cix) {
      let repoChar = this._repo[cix]
      let cmpStrokeCount = repoChar[1]
      let cmpSubStrokes = repoChar[2]
      if ((cmpStrokeCount < minimumStrokes || cmpStrokeCount > maximumStrokes) || (cmpSubStrokes.length < minSubStrokes || cmpSubStrokes.length > maxSubStrokes)) {
        continue
      }
      let match = this._matchOne(strokeCount, inputSubStrokes, subStrokesRange, repoChar)
      matchCollector.fileMatch(match)
    }
    ready(matchCollector.getMatches())
  }

  getCounters () {
    return {
      chars: this._charsChecked,
      subStrokes: this._subStrokesCompared
    }
  }

  _getStrokesRange (strokeCount) {
    if (this._looseness == 0) {
      return 0
    } else if (this._looseness == 1) {
      return HanziLookup.MAX_CHARACTER_STROKE_COUNT
    }
    let ctrl1X = 0.35
    let ctrl1Y = strokeCount * 0.4
    let ctrl2X = 0.6
    let ctrl2Y = strokeCount
    let curve = new HanziLookup.CubicCurve2D(0, 0, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, 1, HanziLookup.MAX_CHARACTER_STROKE_COUNT)
    let t = curve.getFirstSolutionForX(this._looseness)
    return Math.round(curve.getYOnCurve(t))
  }

  _getSubStrokesRange (subStrokeCount) {
    if (this._looseness == 1.0) {
      return HanziLookup.MAX_CHARACTER_SUB_STROKE_COUNT
    }
    let y0 = subStrokeCount * 0.25
    let ctrl1X = 0.4
    let ctrl1Y = 1.5 * y0
    let ctrl2X = 0.75
    let ctrl2Y = 1.5 * ctrl1Y
    let curve = new HanziLookup.CubicCurve2D(0, y0, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, 1, HanziLookup.MAX_CHARACTER_SUB_STROKE_COUNT)
    let t = curve.getFirstSolutionForX(this._looseness)
    return Math.round(curve.getYOnCurve(t))
  }

  _buildScoreMatrix () {
    let dim = HanziLookup.MAX_CHARACTER_SUB_STROKE_COUNT + 1
    let res = []
    for (let i = 0; i < dim; i++) {
      res.push([])
      for (let j = 0; j < dim; j++) res[i].push(0)
    }
    for (let i = 0; i < dim; i++) {
      let penalty = -HanziLookup.AVG_SUBSTROKE_LENGTH * HanziLookup.SKIP_PENALTY_MULTIPLIER * i
      res[i][0] = penalty
      res[0][i] = penalty
    }
    return res
  }

  _matchOne (inputStrokeCount, inputSubStrokes, subStrokesRange, repoChar) {
    ++this._charsChecked
    let score = this._computeMatchScore(inputStrokeCount, inputSubStrokes, subStrokesRange, repoChar)
    if (inputStrokeCount == repoChar[1] && inputStrokeCount < HanziLookup.CORRECT_NUM_STROKES_CAP) {
      let bonus = (HanziLookup.CORRECT_NUM_STROKES_BONUS * Math.max(HanziLookup.CORRECT_NUM_STROKES_CAP - inputStrokeCount, 0)) / HanziLookup.CORRECT_NUM_STROKES_CAP
      score += bonus * score
    }
    return new HanziLookup.CharacterMatch(repoChar[0], score)
  }

  _computeMatchScore (strokeCount, inputSubStrokes, subStrokesRange, repoChar) {
    for (let x = 0; x < inputSubStrokes.length; x++) {
      let inputDirection = inputSubStrokes[x].direction
      let inputLength = inputSubStrokes[x].length
      let inputCenter = [
        inputSubStrokes[x].centerX,
        inputSubStrokes[x].centerY
      ]
      for (let y = 0; y < repoChar[2]; y++) {
        let newScore = Number.NEGATIVE_INFINITY
        if (Math.abs(x - y) <= subStrokesRange) {
          let compareDirection = this._sbin[repoChar[3] + y * 3]
          let compareLength = this._sbin[repoChar[3] + y * 3 + 1]
          let compareCenter = null
          let bCenter = this._sbin[repoChar[3] + y * 3 + 2]
          if (bCenter > 0) {
            compareCenter = [(bCenter & 0xf0) >>> 4, bCenter & 0x0f]
          }
          let skip1Score = this._scoreMatrix[x][y + 1] - (inputLength / 256) * HanziLookup.SKIP_PENALTY_MULTIPLIER
          let skip2Score = this._scoreMatrix[x + 1][y] - (compareLength / 256) * HanziLookup.SKIP_PENALTY_MULTIPLIER
          let skipScore = Math.max(skip1Score, skip2Score)
          let matchScore = this._computeSubStrokeScore(inputDirection, inputLength, compareDirection, compareLength, inputCenter, compareCenter)
          let previousScore = this._scoreMatrix[x][y]
          newScore = Math.max(previousScore + matchScore, skipScore)
        }
        this._scoreMatrix[x + 1][y + 1] = newScore
      }
    }
    return this._scoreMatrix[inputSubStrokes.length][repoChar[2]]
  }

  _computeSubStrokeScore (inputDir, inputLen, repoDir, repoLen, inputCenter, repoCenter) {
    ++this._subStrokesCompared
    let directionScore = this._getDirectionScore(inputDir, repoDir, inputLen)
    let lengthScore = this._getLengthScore(inputLen, repoLen)
    let score = lengthScore * directionScore
    if (repoCenter) {
      let dx = inputCenter[0] - repoCenter[0]
      let dy = inputCenter[1] - repoCenter[1]
      let closeness = this.POS_SCORE_TABLE[dx * dx + dy * dy]
      if (score > 0) {
        score *= closeness
      } else {
        score /= closeness
      }
    }
    return score
  }

  _initScoreTables () {
    let dirCurve = new HanziLookup.CubicCurve2D(0, 1.0, 0.5, 1.0, 0.25, -2.0, 1.0, 1.0)
    this.DIRECTION_SCORE_TABLE = this._initCubicCurveScoreTable(dirCurve, 256)
    let lenCurve = new HanziLookup.CubicCurve2D(0, 0, 0.25, 1.0, 0.75, 1.0, 1.0, 1.0)
    this.LENGTH_SCORE_TABLE = this._initCubicCurveScoreTable(lenCurve, 129)
    this.POS_SCORE_TABLE = []
    for (let i = 0; i <= 450; ++i) {
      this.POS_SCORE_TABLE.push(1 - Math.sqrt(i) / 22)
    }
  }

  _initCubicCurveScoreTable (curve, numSamples) {
    let x1 = curve.x1()
    let x2 = curve.x2()
    let range = x2 - x1
    let x = x1
    let xInc = range / numSamples
    let scoreTable = []
    for (let i = 0; i < numSamples; i++) {
      let t = curve.getFirstSolutionForX(Math.min(x, x2))
      scoreTable.push(curve.getYOnCurve(t))
      x += xInc
    }
    return scoreTable
  }

  _getDirectionScore (direction1, direction2, inputLength) {
    let theta = Math.abs(direction1 - direction2)
    let directionScore = this.DIRECTION_SCORE_TABLE[theta]
    if (inputLength < 64) {
      let shortLengthBonusMax = Math.min(1.0, 1.0 - directionScore)
      let shortLengthBonus = shortLengthBonusMax * (1 - inputLength / 64)
      directionScore += shortLengthBonus
    }
    return directionScore
  }

  _getLengthScore (length1, length2) {
    const ratio = length1 > length2 ? Math.round((length2 << 7) / length1) : Math.round((length1 << 7) / length2)
    return this.LENGTH_SCORE_TABLE[ratio]
  }
}
HanziLookup.Matcher = Matcher

HanziLookup.StrokeInputOverlay = StrokeInputOverlay

export default HanziLookup
