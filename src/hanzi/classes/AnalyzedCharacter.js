import AnalyzedStroke from './AnalyzedStroke'
import SubStroke from './SubStroke'

class AnalyzedCharacter {
  constructor (rawStrokes) {
    const MIN_SEGMENT_LENGTH = 12.5
    const MAX_LOCAL_LENGTH_RATIO = 1.1
    const MAX_RUNNING_LENGTH_RATIO = 1.09
    this._top = Number.MAX_SAFE_INTEGER
    this._bottom = Number.MIN_SAFE_INTEGER
    this._left = Number.MAX_SAFE_INTEGER
    this._right = Number.MIN_SAFE_INTEGER
    this._analyzedStrokes = []
    this._subStrokeCount = 0

    this._getBoundingRect(rawStrokes)
    this._buildAnalyzedStrokes(rawStrokes)

    this.top = this._top <= 256 ? this._top : 0
    this.bottom = this._bottom >= 0 ? this._bottom : 256
    this.left = this._left <= 256 ? this._left : 0
    this.right = this._right >= 0 ? this._right : 256
    this.analyzedStrokes = this._analyzedStrokes
    this.subStrokeCount = this._subStrokeCount
    this.MIN_SEGMENT_LENGTH = MIN_SEGMENT_LENGTH
    this.MAX_LOCAL_LENGTH_RATIO = MAX_LOCAL_LENGTH_RATIO
    this.MAX_RUNNING_LENGTH_RATIO = MAX_RUNNING_LENGTH_RATIO
  }

  _getBoundingRect (rawStrokes) {
    for (let i = 0; i != rawStrokes.length; ++i) {
      for (let j = 0; j != rawStrokes[i].length; ++j) {
        let pt = rawStrokes[i][j]
        if (pt[0] < this._left) this._left = pt[0]
        if (pt[0] > this._right) this._right = pt[0]
        if (pt[1] < this._top) this._top = pt[1]
        if (pt[1] > this._bottom) this._bottom = pt[1]
      }
    }
  }

  _dist (a, b) {
    let dx = a[0] - b[0]
    let dy = a[1] - b[1]
    return Math.sqrt(dx * dx + dy * dy)
  }

  _normDist (a, b) {
    let width = this._right - this._left
    let height = this._bottom - this._top
    let dimensionSquared = width > height ? width * width : height * height
    let normalizer = Math.sqrt(dimensionSquared + dimensionSquared)
    let distanceNormalized = this._dist(a, b) / normalizer
    return Math.min(distanceNormalized, 1)
  }

  _dir (a, b) {
    return Math.PI - Math.atan2(a[1] - b[1], a[0] - b[0])
  }

  _getPivotIndexes (points) {
    let markers = []
    for (let i = 0; i != points.length; ++i) {
      markers.push(false)
    }
    let prevPtIx = 0
    let firstPtIx = 0
    let pivotPtIx = 1
    markers[0] = true
    let localLength = this._dist(points[firstPtIx], points[pivotPtIx])
    let runningLength = localLength
    for (let i = 2; i < points.length; ++i) {
      let nextPoint = points[i]
      let pivotLength = this._dist(points[pivotPtIx], nextPoint)
      localLength += pivotLength
      runningLength += pivotLength
      let distFromPrevious = this._dist(points[prevPtIx], nextPoint)
      let distFromFirst = this._dist(points[firstPtIx], nextPoint)
      if (localLength > this.MAX_LOCAL_LENGTH_RATIO * distFromPrevious || runningLength > this.MAX_RUNNING_LENGTH_RATIO * distFromFirst) {
        if (markers[prevPtIx] && this._dist(points[prevPtIx], points[pivotPtIx]) < this.MIN_SEGMENT_LENGTH) {
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
    if (markers[prevPtIx] && this._dist(points[prevPtIx], points[pivotPtIx]) < this.MIN_SEGMENT_LENGTH && prevPtIx != 0) {
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

  _getNormCenter (a, b) {
    let x = (a[0] + b[0]) / 2
    let y = (a[1] + b[1]) / 2
    let side
    if (this._right - this._left > this._bottom - this._top) {
      side = this._right - this._left
      let height = this._bottom - this._top
      x = x - this._left
      y = y - this._top + (side - height) / 2
    } else {
      side = this._bottom - this._top
      let width = this._right - this._left
      x = x - this._left + (side - width) / 2
      y = y - this._top
    }
    return [x / side, y / side]
  }

  // Builds array of substrokes from stroke's points, pivots, and character's bounding rectangle
  _buildSubStrokes (points, pivotIndexes) {
    let res = []
    let prevIx = 0
    for (let i = 0; i != pivotIndexes.length; ++i) {
      let ix = pivotIndexes[i]
      if (ix == prevIx) {
        continue
      }
      let direction = this._dir(points[prevIx], points[ix])
      direction = Math.round((direction * 256.0) / Math.PI / 2.0)
      if (direction == 256) direction = 0
      let normLength = this._normDist(points[prevIx], points[ix])
      normLength = Math.round(normLength * 255)
      let center = this._getNormCenter(points[prevIx], points[ix])
      center[0] = Math.round(center[0] * 15)
      center[1] = Math.round(center[1] * 15)
      res.push(new SubStroke(direction, normLength, center[0], center[1]))
      prevIx = ix
    }
    return res
  }

  _buildAnalyzedStrokes (rawStrokes) {
    for (let i = 0; i != rawStrokes.length; ++i) {
      const pivotIndexes = this._getPivotIndexes(rawStrokes[i])
      const subStrokes = this._buildSubStrokes(rawStrokes[i], pivotIndexes)
      this._subStrokeCount += subStrokes.length
      this._analyzedStrokes.push(new AnalyzedStroke(rawStrokes[i], pivotIndexes, subStrokes))
    }
  }
}
export default AnalyzedCharacter
