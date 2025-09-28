/* eslint no-redeclare: "off" */
/* eslint no-undef: "off" */

import AnalyzedCharacter from './classes/AnalyzedCharacter'
import AnalyzedStroke from './classes/AnalyzedStroke'
import CharacterMatch from './classes/CharacterMatch'
import CubicCurve2D from './classes/CubicCurve2D'
import DrawingBoard from './classes/DrawingBoard'
import StrokeInputOverlay from './classes/StrokeInputOverlay'

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

  var chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

  // Use a lookup table to find the index.
  var lookup = new Uint8Array(256)
  for (var i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i
  }

  var bufferLength = base64.length * 0.75,
    len = base64.length,
    i,
    p = 0,
    encoded1,
    encoded2,
    encoded3,
    encoded4

  if (base64[base64.length - 1] === '=') {
    bufferLength--
    if (base64[base64.length - 2] === '=') {
      bufferLength--
    }
  }

  var arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer)

  for (i = 0; i < len; i += 4) {
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
    HanziLookup.data[key].substrokes = HanziLookup.decodeCompact(
      data.substrokes
    )
  }
}

HanziLookup.MatchCollector = function (limit) {
  'use strict'

  var _count = 0
  var _matches = []

  for (var i = 0; i != limit; ++i) _matches.push(null)

  function findSlot (score) {
    var ix
    for (ix = 0; ix < _count; ++ix) {
      if (_matches[ix].score < score) return ix
    }
    return ix
  }

  function removeExistingLower (match) {
    var ix = -1
    for (var i = 0; i != _count; ++i) {
      if (_matches[i].character == match.character) {
        ix = i
        break
      }
    }
    // Not there yet: we're good, match doesn't need to be skipped
    if (ix == -1) return false
    // New score is not better: skip this match
    if (match.score <= _matches[ix].score) return true
    // Remove existing match; don't skip new. Means shifting array left.
    for (var i = ix; i < _matches.length - 1; ++i)
      _matches[i] = _matches[i + 1]
    --_count
    return false
  }

  function doFileMatch (match) {
    // Already at limit: don't bother if new match's score is smaller than current minimum
    if (
      _count == _matches.length &&
      match.score <= _matches[_matches.length - 1].score
    )
      return
    // Remove if we already have this character with a lower score
    // If "true", we should skip new match (already there with higher score)
    if (removeExistingLower(match)) return
    // Where does new match go? (Keep array sorted largest score to smallest.)
    var pos = findSlot(match.score)
    // Slide rest to the right
    for (var i = _matches.length - 1; i > pos; --i)
      _matches[i] = _matches[i - 1]
    // Replace at position
    _matches[pos] = match
    // Increase count if we're just now filling up
    if (_count < _matches.length) ++_count
  }

  function doGetMatches () {
    return _matches.slice(0, _count)
  }

  return {
    fileMatch: function (match) {
      doFileMatch(match)
    },
    getMatches: function () {
      return doGetMatches()
    }
  }
}

// Magic constants
HanziLookup.MAX_CHARACTER_STROKE_COUNT = 48
HanziLookup.MAX_CHARACTER_SUB_STROKE_COUNT = 64
HanziLookup.DEFAULT_LOOSENESS = 0.15
HanziLookup.AVG_SUBSTROKE_LENGTH = 0.33 // an average length (out of 1)
HanziLookup.SKIP_PENALTY_MULTIPLIER = 1.75 // penalty mulitplier for skipping a stroke
HanziLookup.CORRECT_NUM_STROKES_BONUS = 0.1 // max multiplier bonus if characters has the correct number of strokes
HanziLookup.CORRECT_NUM_STROKES_CAP = 10 // characters with more strokes than this will not be multiplied

HanziLookup.Matcher = function (dataName, looseness) {
  'use strict'

  var _looseness = looseness || HanziLookup.DEFAULT_LOOSENESS
  var _repo = HanziLookup.data[dataName].chars
  var _sbin = HanziLookup.data[dataName].substrokes
  var _scoreMatrix = buildScoreMatrix()
  var _charsChecked
  var _subStrokesCompared

  var DIRECTION_SCORE_TABLE
  var LENGTH_SCORE_TABLE
  var POS_SCORE_TABLE

  // Init score tables
  initScoreTables()

  function doMatch (inputChar, limit, ready) {
    console.time('doMatch')
    // Diagnostic counters
    _charsChecked = 0
    _subStrokesCompared = 0

    // This will gather matches
    var matchCollector = new HanziLookup.MatchCollector(limit)

    // Edge case: empty input should return no matches; but permissive lookup does find a few...
    if (inputChar.analyzedStrokes.length == 0)
      return matchCollector.getMatches()

    // Flat format: matching needs this. Only transform once.
    var inputSubStrokes = []
    for (var i = 0; i != inputChar.analyzedStrokes.length; ++i) {
      var stroke = inputChar.analyzedStrokes[i]
      for (var j = 0; j != stroke.subStrokes.length; ++j) {
        inputSubStrokes.push(stroke.subStrokes[j])
      }
    }

    // Some pre-computed looseness magic
    var strokeCount = inputChar.analyzedStrokes.length
    var subStrokeCount = inputChar.subStrokeCount
    // Get the range of strokes to compare against based on the loosness.
    // Characters with fewer strokes than strokeCount - strokeRange
    // or more than strokeCount + strokeRange won't even be considered.
    var strokeRange = getStrokesRange(strokeCount)
    var minimumStrokes = Math.max(strokeCount - strokeRange, 1)
    var maximumStrokes = Math.min(
      strokeCount + strokeRange,
      HanziLookup.MAX_CHARACTER_STROKE_COUNT
    )
    // Get the range of substrokes to compare against based on looseness.
    // When trying to match sub stroke patterns, won't compare sub strokes
    // that are farther about in sequence than this range.  This is to make
    // computing matches less expensive for low loosenesses.
    var subStrokesRange = getSubStrokesRange(subStrokeCount)
    var minSubStrokes = Math.max(subStrokeCount - subStrokesRange, 1)
    var maxSubStrokes = Math.min(
      subStrokeCount + subStrokesRange,
      HanziLookup.MAX_CHARACTER_SUB_STROKE_COUNT
    )
    // Iterate over all characters in repo
    for (var cix = 0; cix != _repo.length; ++cix) {
      var repoChar = _repo[cix]
      var cmpStrokeCount = repoChar[1]
      var cmpSubStrokes = repoChar[2]
      if (cmpStrokeCount < minimumStrokes || cmpStrokeCount > maximumStrokes)
        continue
      if (
        cmpSubStrokes.length < minSubStrokes ||
        cmpSubStrokes.length > maxSubStrokes
      )
        continue
      // Match against character in repo
      var match = matchOne(
        strokeCount,
        inputSubStrokes,
        subStrokesRange,
        repoChar
      )
      // File; collector takes care of comparisons and keeping N-best
      matchCollector.fileMatch(match)
    }
    // When done: just return collected matches
    // This is an array of CharacterMatch objects
    console.timeEnd('doMatch')
    ready(matchCollector.getMatches())
  }

  function getStrokesRange (strokeCount) {
    if (_looseness == 0) {
      return 0
    }
    if (_looseness == 1) {
      return HanziLookup.MAX_CHARACTER_STROKE_COUNT
    }
    let ctrl1X = 0.35
    let ctrl1Y = strokeCount * 0.4
    let ctrl2X = 0.6
    let ctrl2Y = strokeCount
    let curve = new HanziLookup.CubicCurve2D(0, 0, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, 1, HanziLookup.MAX_CHARACTER_STROKE_COUNT)
    let t = curve.getFirstSolutionForX(_looseness)
    return Math.round(curve.getYOnCurve(t))
  }

  function getSubStrokesRange (subStrokeCount) {
    if (_looseness == 1.0) {
      return HanziLookup.MAX_CHARACTER_SUB_STROKE_COUNT
    }
    let y0 = subStrokeCount * 0.25
    let ctrl1X = 0.4
    let ctrl1Y = 1.5 * y0
    let ctrl2X = 0.75
    let ctrl2Y = 1.5 * ctrl1Y
    let curve = new HanziLookup.CubicCurve2D(0, y0, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, 1, HanziLookup.MAX_CHARACTER_SUB_STROKE_COUNT)
    let t = curve.getFirstSolutionForX(_looseness)
    return Math.round(curve.getYOnCurve(t))
  }

  function buildScoreMatrix () {
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

  function matchOne (inputStrokeCount, inputSubStrokes, subStrokesRange, repoChar) {
    ++_charsChecked
    let score = computeMatchScore(inputStrokeCount, inputSubStrokes, subStrokesRange, repoChar)
    if (inputStrokeCount == repoChar[1] && inputStrokeCount < HanziLookup.CORRECT_NUM_STROKES_CAP) {
      let bonus = (HanziLookup.CORRECT_NUM_STROKES_BONUS * Math.max(HanziLookup.CORRECT_NUM_STROKES_CAP - inputStrokeCount, 0)) / HanziLookup.CORRECT_NUM_STROKES_CAP
      score += bonus * score
    }
    return new HanziLookup.CharacterMatch(repoChar[0], score)
  }

  function computeMatchScore (strokeCount, inputSubStrokes, subStrokesRange, repoChar) {
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
          let compareDirection = _sbin[repoChar[3] + y * 3]
          let compareLength = _sbin[repoChar[3] + y * 3 + 1]
          let compareCenter = null
          let bCenter = _sbin[repoChar[3] + y * 3 + 2]
          if (bCenter > 0) {
            compareCenter = [(bCenter & 0xf0) >>> 4, bCenter & 0x0f]
          }
          let skip1Score = _scoreMatrix[x][y + 1] - (inputLength / 256) * HanziLookup.SKIP_PENALTY_MULTIPLIER
          let skip2Score = _scoreMatrix[x + 1][y] - (compareLength / 256) * HanziLookup.SKIP_PENALTY_MULTIPLIER
          let skipScore = Math.max(skip1Score, skip2Score)
          let matchScore = computeSubStrokeScore(inputDirection, inputLength, compareDirection, compareLength, inputCenter, compareCenter)
          let previousScore = _scoreMatrix[x][y]
          newScore = Math.max(previousScore + matchScore, skipScore)
        }
        _scoreMatrix[x + 1][y + 1] = newScore
      }
    }
    return _scoreMatrix[inputSubStrokes.length][repoChar[2]]
  }

  function computeSubStrokeScore (inputDir, inputLen, repoDir, repoLen, inputCenter, repoCenter) {
    ++_subStrokesCompared
    let directionScore = getDirectionScore(inputDir, repoDir, inputLen)
    let lengthScore = getLengthScore(inputLen, repoLen)
    let score = lengthScore * directionScore
    if (repoCenter) {
      let dx = inputCenter[0] - repoCenter[0]
      let dy = inputCenter[1] - repoCenter[1]
      let closeness = POS_SCORE_TABLE[dx * dx + dy * dy]
      if (score > 0) {
        score *= closeness
      } else {
        score /= closeness
      }
    }
    return score
  }

  function initScoreTables () {
    let dirCurve = new HanziLookup.CubicCurve2D(0, 1.0, 0.5, 1.0, 0.25, -2.0, 1.0, 1.0)
    DIRECTION_SCORE_TABLE = initCubicCurveScoreTable(dirCurve, 256)
    let lenCurve = new HanziLookup.CubicCurve2D(0, 0, 0.25, 1.0, 0.75, 1.0, 1.0, 1.0)
    LENGTH_SCORE_TABLE = initCubicCurveScoreTable(lenCurve, 129)
    POS_SCORE_TABLE = []
    for (let i = 0; i <= 450; ++i) {
      POS_SCORE_TABLE.push(1 - Math.sqrt(i) / 22)
    }
  }

  function initCubicCurveScoreTable (curve, numSamples) {
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

  function getDirectionScore (direction1, direction2, inputLength) {
    let theta = Math.abs(direction1 - direction2)
    let directionScore = DIRECTION_SCORE_TABLE[theta]
    if (inputLength < 64) {
      let shortLengthBonusMax = Math.min(1.0, 1.0 - directionScore)
      let shortLengthBonus = shortLengthBonusMax * (1 - inputLength / 64)
      directionScore += shortLengthBonus
    }
    return directionScore
  }

  function getLengthScore (length1, length2) {
    const ratio = length1 > length2 ? Math.round((length2 << 7) / length1) : Math.round((length1 << 7) / length2)
    return LENGTH_SCORE_TABLE[ratio]
  }

  return {
    match: function (analyzedChar, limit, ready) {
      doMatch(analyzedChar, limit, ready)
    },
    getCounters: function () {
      return {
        chars: _charsChecked,
        subStrokes: _subStrokesCompared
      }
    }
  }
}

HanziLookup.StrokeInputOverlay = StrokeInputOverlay

export default HanziLookup
