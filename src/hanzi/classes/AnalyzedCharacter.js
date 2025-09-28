import AnalyzedStroke from './AnalyzedStroke'
import SubStroke from './SubStroke'

function AnalyzedCharacter (rawStrokes) {
  'use strict'
  let MIN_SEGMENT_LENGTH = 12.5
  let MAX_LOCAL_LENGTH_RATIO = 1.1
  let MAX_RUNNING_LENGTH_RATIO = 1.09
  let _top = Number.MAX_SAFE_INTEGER
  let _bottom = Number.MIN_SAFE_INTEGER
  let _left = Number.MAX_SAFE_INTEGER
  let _right = Number.MIN_SAFE_INTEGER
  let _analyzedStrokes = []
  let _subStrokeCount = 0
  getBoundingRect(rawStrokes)
  buildAnalyzedStrokes(rawStrokes)
  this.top = _top <= 256 ? _top : 0
  this.bottom = _bottom >= 0 ? _bottom : 256
  this.left = _left <= 256 ? _left : 0
  this.right = _right >= 0 ? _right : 256
  this.analyzedStrokes = _analyzedStrokes
  this.subStrokeCount = _subStrokeCount

  function getBoundingRect (rawStrokes) {
    for (let i = 0; i != rawStrokes.length; ++i) {
      for (let j = 0; j != rawStrokes[i].length; ++j) {
        let pt = rawStrokes[i][j]
        if (pt[0] < _left) _left = pt[0]
        if (pt[0] > _right) _right = pt[0]
        if (pt[1] < _top) _top = pt[1]
        if (pt[1] > _bottom) _bottom = pt[1]
      }
    }
  }

  function dist (a, b) {
    let dx = a[0] - b[0]
    let dy = a[1] - b[1]
    return Math.sqrt(dx * dx + dy * dy)
  }

  function normDist (a, b) {
    let width = _right - _left
    let height = _bottom - _top
    let dimensionSquared = width > height ? width * width : height * height
    let normalizer = Math.sqrt(dimensionSquared + dimensionSquared)
    let distanceNormalized = dist(a, b) / normalizer
    return Math.min(distanceNormalized, 1)
  }

  function dir (a, b) {
    return Math.PI - Math.atan2(a[1] - b[1], a[0] - b[0])
  }

  function getPivotIndexes (points) {
    let markers = []
    for (let i = 0; i != points.length; ++i) {
      markers.push(false)
    }
    let prevPtIx = 0
    let firstPtIx = 0
    let pivotPtIx = 1
    markers[0] = true
    let localLength = dist(points[firstPtIx], points[pivotPtIx])
    let runningLength = localLength
    for (let i = 2; i < points.length; ++i) {
      let nextPoint = points[i]
      let pivotLength = dist(points[pivotPtIx], nextPoint)
      localLength += pivotLength
      runningLength += pivotLength
      let distFromPrevious = dist(points[prevPtIx], nextPoint)
      let distFromFirst = dist(points[firstPtIx], nextPoint)
      if (localLength > MAX_LOCAL_LENGTH_RATIO * distFromPrevious || runningLength > MAX_RUNNING_LENGTH_RATIO * distFromFirst) {
        if (markers[prevPtIx] && dist(points[prevPtIx], points[pivotPtIx]) < MIN_SEGMENT_LENGTH) {
          markers[prevPtIx] = false
        }
        markers[pivotPtIx] = true
        runningLength = pivotLength
        firstPtIx = pivotPtIx
      }
      localLength = pivotLength
      prevPtIx = pivotPtIx
      pivotPtIx = i
    }
    markers[pivotPtIx] = true
    if (markers[prevPtIx] && dist(points[prevPtIx], points[pivotPtIx]) < MIN_SEGMENT_LENGTH && prevPtIx != 0) {
      markers[prevPtIx] = false
    }
    let res = []
    for (let i = 0; i != markers.length; ++i) {
      if (markers[i]) {
        res.push(i)
      }
    }
    return res
  }

  function getNormCenter (a, b) {
    let x = (a[0] + b[0]) / 2
    let y = (a[1] + b[1]) / 2
    let side
    if (_right - _left > _bottom - _top) {
      side = _right - _left
      let height = _bottom - _top
      x = x - _left
      y = y - _top + (side - height) / 2
    } else {
      side = _bottom - _top
      let width = _right - _left
      x = x - _left + (side - width) / 2
      y = y - _top
    }
    return [x / side, y / side]
  }

  // Builds array of substrokes from stroke's points, pivots, and character's bounding rectangle
  function buildSubStrokes (points, pivotIndexes) {
    let res = []
    let prevIx = 0
    for (let i = 0; i != pivotIndexes.length; ++i) {
      let ix = pivotIndexes[i]
      if (ix == prevIx) {
        continue
      }
      let direction = dir(points[prevIx], points[ix])
      direction = Math.round((direction * 256.0) / Math.PI / 2.0)
      if (direction == 256) direction = 0
      let normLength = normDist(points[prevIx], points[ix])
      normLength = Math.round(normLength * 255)
      let center = getNormCenter(points[prevIx], points[ix])
      center[0] = Math.round(center[0] * 15)
      center[1] = Math.round(center[1] * 15)
      res.push(new SubStroke(direction, normLength, center[0], center[1]))
      prevIx = ix
    }
    return res
  }

  function buildAnalyzedStrokes (rawStrokes) {
    for (let i = 0; i != rawStrokes.length; ++i) {
      const pivotIndexes = getPivotIndexes(rawStrokes[i])
      const subStrokes = buildSubStrokes(rawStrokes[i], pivotIndexes)
      _subStrokeCount += subStrokes.length
      _analyzedStrokes.push(new AnalyzedStroke(rawStrokes[i], pivotIndexes, subStrokes))
    }
  }
}
export default AnalyzedCharacter
