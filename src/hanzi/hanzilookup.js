import autoBind from 'auto-bind'
class HanziLookup {
  constructor () {
    autoBind(this)
    this.data = {}
    this.options = {
      drawingGrid: false,
      strokeColor: 'red'
    }
    this.MAX_CHARACTER_STROKE_COUNT = 48
    this.MAX_CHARACTER_SUB_STROKE_COUNT = 64
    this.DEFAULT_LOOSENESS = 0.15
    this.AVG_SUBSTROKE_LENGTH = 0.33 // an average length (out of 1)
    this.SKIP_PENALTY_MULTIPLIER = 1.75 // penalty mulitplier for skipping a stroke
    this.CORRECT_NUM_STROKES_BONUS = 0.1 // max multiplier bonus if characters has the correct number of strokes
    this.CORRECT_NUM_STROKES_CAP = 10 // characters with more strokes than this will not be multiplied
    this.MIN_SEGMENT_LENGTH = 12.5
    this.MAX_LOCAL_LENGTH_RATIO = 1.1
    this.MAX_RUNNING_LENGTH_RATIO = 1.09
  }

  AnalyzedCharacter (rawStrokes) {
    this._top = Number.MAX_SAFE_INTEGER
    this._bottom = Number.MIN_SAFE_INTEGER
    this._left = Number.MAX_SAFE_INTEGER
    this._right = Number.MIN_SAFE_INTEGER
    this._analyzedStrokes = []
    this._subStrokeCount = 0
    this.getBoundingRect(rawStrokes)
    this.buildAnalyzedStrokes(rawStrokes)
    this.top = this._top <= 256 ? this._top : 0
    this.bottom = this._bottom >= 0 ? this._bottom : 256
    this.left = this._left <= 256 ? this._left : 0
    this.right = this._right >= 0 ? this._right : 256
    return {
      analyzedStrokes: this._analyzedStrokes,
      subStrokeCount: this._subStrokeCount
    }
  }

  getBoundingRect (rawStrokes) {
    for (let i = 0; i != rawStrokes.length; ++i) {
      for (let j = 0; j != rawStrokes[i].length; ++j) {
        const pt = rawStrokes[i][j]
        if (pt[0] < this._left) {
          this._left = pt[0]
        }
        if (pt[0] > this._right) {
          this._right = pt[0]
        }
        if (pt[1] < this._top) {
          this._top = pt[1]
        }
        if (pt[1] > this._bottom) {
          this._bottom = pt[1]
        }
      }
    }
  }

  dist (a, b) {
    const dx = a[0] - b[0]
    const dy = a[1] - b[1]
    return Math.sqrt(dx * dx + dy * dy)
  }

  normDist (a, b) {
    const width = this._right - this._left
    const height = this._bottom - this._top
    const dimensionSquared = width > height ? width * width : height * height
    const normalizer = Math.sqrt(dimensionSquared + dimensionSquared)
    const distanceNormalized = this.dist(a, b) / normalizer
    return Math.min(distanceNormalized, 1)
  }

  dir (a, b) {
    const dx = a[0] - b[0]
    const dy = a[1] - b[1]
    const dir = Math.atan2(dy, dx)
    return Math.PI - dir
  }

  getPivotIndexes (points) {
    let markers = []
    for (let i = 0; i != points.length; ++i) {
      markers.push(false)
    }
    let prevPtIx = 0
    let firstPtIx = 0
    let pivotPtIx = 1
    markers[0] = true
    let localLength = this.dist(points[firstPtIx], points[pivotPtIx])
    let runningLength = localLength
    for (let i = 2; i < points.length; ++i) {
      let nextPoint = points[i]
      let pivotLength = this.dist(points[pivotPtIx], nextPoint)
      localLength += pivotLength
      runningLength += pivotLength
      let distFromPrevious = this.dist(points[prevPtIx], nextPoint)
      let distFromFirst = this.dist(points[firstPtIx], nextPoint)
      if (localLength > this.MAX_LOCAL_LENGTH_RATIO * distFromPrevious || runningLength > this.MAX_RUNNING_LENGTH_RATIO * distFromFirst) {
        if (markers[prevPtIx] && this.dist(points[prevPtIx], points[pivotPtIx]) < this.MIN_SEGMENT_LENGTH) {
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
    if (markers[prevPtIx] && this.dist(points[prevPtIx], points[pivotPtIx]) < this.MIN_SEGMENT_LENGTH && prevPtIx != 0) {
      markers[prevPtIx] = false
    }
    let res = []
    for (let i = 0; i != markers.length; ++i) {
      if (markers[i]) res.push(i)
    }
    return res
  }

  getNormCenter (a, b) {
    let x = (a[0] + b[0]) / 2
    let y = (a[1] + b[1]) / 2
    let side
    if (this._right - this._left > this._bottom - this._top) {
      side = this._right - this._left
      let height = this._bottom - this._top
      x = x - this._left
      y = y - this._top + (side - height) / 2
    }
    else {
      side = this._bottom - this._top
      let width = this._right - this._left
      x = x - this._left + (side - width) / 2
      y = y - this._top
    }
    return [x / side, y / side]
  }

  buildSubStrokes (points, pivotIndexes) {
    let res = []
    let prevIx = 0
    for (let i = 0; i != pivotIndexes.length; ++i) {
      let ix = pivotIndexes[i]
      if (ix == prevIx) {
        continue
      }
      let direction = this.dir(points[prevIx], points[ix])
      direction = Math.round((direction * 256.0) / Math.PI / 2.0)
      if (direction == 256) direction = 0
      let normLength = this.normDist(points[prevIx], points[ix])
      normLength = Math.round(normLength * 255)
      let center = this.getNormCenter(points[prevIx], points[ix])
      center[0] = Math.round(center[0] * 15)
      center[1] = Math.round(center[1] * 15)
      res.push(this.SubStroke(direction, normLength, center[0], center[1]))
      prevIx = ix
    }
    return res
  }

  buildAnalyzedStrokes (rawStrokes) {
    // console.time('buildAnalyzedStrokes')
    for (let i = 0; i != rawStrokes.length; ++i) {
      let pivotIndexes = this.getPivotIndexes(rawStrokes[i])
      let subStrokes = this.buildSubStrokes(rawStrokes[i], pivotIndexes)
      this._subStrokeCount += subStrokes.length
      this._analyzedStrokes.push(this.AnalyzedStroke(rawStrokes[i], pivotIndexes, subStrokes))
    }
    // console.timeEnd('buildAnalyzedStrokes')
  }

  AnalyzedStroke (points, pivotIndexes, subStrokes) {
    return {points, pivotIndexes, subStrokes}
  }

  CharacterMatch (character, score) {
    return {character, score}
  }

  getCubicAx () {
    return this._x2 - this._x1 - this.getCubicBx() - this.getCubicCx()
  }
  getCubicAy () {
    return this._y2 - this._y1 - this.getCubicBy() - this.getCubicCy()
  }
  getCubicBx () {
    return 3.0 * (this._ctrlX2 - this._ctrlX1) - this.getCubicCx()
  }
  getCubicBy () {
    return 3.0 * (this._ctrlY2 - this._ctrlY1) - this.getCubicCy()
  }
  getCubicCx () {
    return 3.0 * (this._ctrlX1 - this._x1)
  }
  getCubicCy () {
    return 3.0 * (this._ctrlY1 - this._y1)
  }

  doSolveForX (x) {
    let solutions = []
    let a = this.getCubicAx(this._x1, this._x2, this._ctrlX1, this._ctrlX2)
    let b = this.getCubicBx()
    let c = this.getCubicCx()
    let d = this._x1 - x
    let f = ((3.0 * c) / a - (b * b) / (a * a)) / 3.0
    let g = ((2.0 * b * b * b) / (a * a * a) - (9.0 * b * c) / (a * a) + (27.0 * d) / a) / 27.0
    let h = (g * g) / 4.0 + (f * f * f) / 27.0
    if (h > 0) {
      let u = 0 - g
      let r = u / 2 + Math.pow(h, 0.5)
      let s = Math.pow(r, 1 / 3)
      let t = u / 2 - Math.pow(h, 0.5)
      let v = Math.pow(-t, 1 / 3)
      let x3 = s - v - b / (3 * a)
      solutions.push(x3)
    } else if (f == 0.0 && g == 0.0 && h == 0.0) {
      solutions.push(-Math.pow(d / a, 1.0 / 3.0))
    } else {
      let i = Math.sqrt((g * g) / 4.0 - h)
      let j = Math.pow(i, 1.0 / 3.0)
      let k = Math.acos(-g / (2 * i))
      let l = -j
      let m = Math.cos(k / 3.0)
      let n = Math.sqrt(3.0) * Math.sin(k / 3.0)
      let p = -b / (3.0 * a)
      solutions.push(2.0 * j * Math.cos(k / 3.0) - b / (3.0 * a))
      solutions.push(l * (m + n) + p)
      solutions.push(l * (m - n) + p)
    }
    return solutions
  }

  getYOnCurve (t) {
    const ay = this.getCubicAy()
    const by = this.getCubicBy()
    const cy = this.getCubicCy()
    const tSquared = t * t
    const tCubed = t * tSquared
    const y = ay * tCubed + by * tSquared + cy * t + this._y1
    return y
  }

  solveForX (x) {
    return this.doSolveForX(x)
  }

  getFirstSolutionForX (x) {
    let solutions = this.doSolveForX(x)
    for (let i = 0; i != solutions.length; ++i) {
      let d = solutions[i]
      if (d >= -0.00000001 && d <= 1.00000001) {
        if (d >= 0.0 && d <= 1.0) {
          return d
        } else if (d < 0.0) {
          return 0.0
        }
        return 1.0
      }
    }
    return NaN
  }

  CubicCurve2D (x1, y1, ctrlx1, ctrly1, ctrlx2, ctrly2, x2, y2) {
    this._x1 = x1
    this._y1 = y1
    this._ctrlX1 = ctrlx1
    this._ctrlY1 = ctrly1
    this._ctrlX2 = ctrlx2
    this._ctrlY2 = ctrly2
    this._x2 = x2
    this._y2 = y2
    return {
      x1: () => this._x1,
      x2: () => this._x2,
      getYOnCurve: this.getYOnCurve,
      solveForX: this.solveForX,
      getFirstSolutionForX: this.getFirstSolutionForX
    }
  }

  decodeCompact (base64) {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    let lookup = new Uint8Array(256)
    for (let i = 0; i < chars.length; i++) {
      lookup[chars.charCodeAt(i)] = i
    }
    let bufferLength = base64.length * 0.75,
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
    let arraybuffer = new ArrayBuffer(bufferLength)
    let bytes = new Uint8Array(arraybuffer)
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
  getOffsetLeft (el) {
    let left = 0
    while (el) {
      left += el.offsetLeft
      el = el.offsetParent
    }
    return left
  }
  getOffsetTop (el) {
    let top = 0
    while (el) {
      top += el.offsetTop
      el = el.offsetParent
    }
    return top
  }

  drawClearCanvas () {
    this._ctx.clearRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.height)
    if (!this.options || !this.options.drawingGrid) {
      return
    }
    this._ctx.setLineDash([1, 1])
    this._ctx.lineWidth = 0.5
    this._ctx.strokeStyle = 'grey'
    this._ctx.beginPath()
    this._ctx.moveTo(0, 0)
    this._ctx.lineTo(this._ctx.canvas.width, 0)
    this._ctx.lineTo(this._ctx.canvas.width, this._ctx.canvas.height)
    this._ctx.lineTo(0, this._ctx.canvas.height)
    this._ctx.lineTo(0, 0)
    this._ctx.stroke()
    this._ctx.beginPath()
    this._ctx.moveTo(0, 0)
    this._ctx.lineTo(this._ctx.canvas.width, this._ctx.canvas.height)
    this._ctx.stroke()
    this._ctx.beginPath()
    this._ctx.moveTo(this._ctx.canvas.width, 0)
    this._ctx.lineTo(0, this._ctx.canvas.height)
    this._ctx.stroke()
    this._ctx.beginPath()
    this._ctx.moveTo(this._ctx.canvas.width / 2, 0)
    this._ctx.lineTo(this._ctx.canvas.width / 2, this._ctx.canvas.height)
    this._ctx.stroke()
    this._ctx.beginPath()
    this._ctx.moveTo(0, this._ctx.canvas.height / 2)
    this._ctx.lineTo(this._ctx.canvas.width, this._ctx.canvas.height / 2)
    this._ctx.stroke()
  }

  startClick (x, y) {
    this.clicking = true
    this._currentStroke = []
    this.lastPt = [x, y]
    this._currentStroke.push(this.lastPt)
    this._ctx.strokeStyle = this.options.strokeColor
    this._ctx.setLineDash([])
    this._ctx.lineWidth = this.strokeWidth
    this._ctx.beginPath()
    this._ctx.moveTo(x, y)
    this.tstamp = new Date()
  }
  dragClick (x, y) {
    if (new Date().getTime() - this.tstamp < 50) {
      return
    }
    this.tstamp = new Date()
    let pt = [x, y]
    if (pt[0] == this.lastPt[0] && pt[1] == this.lastPt[1]) {
      return
    }
    this._currentStroke.push(pt)
    this.lastPt = pt
    this._ctx.lineTo(x, y)
    this._ctx.stroke()
  }
  endClick (x, y) {
    this.clicking = false
    if (x == -1) {
      return
    }
    this._ctx.lineTo(x, y)
    this._ctx.stroke()
    this._currentStroke.push([x, y])
    this._rawStrokes.push(this._currentStroke)
    this._currentStroke = []
    if (this._strokeFinished) {
      this._strokeFinished()
    }
  }

  redrawInput () {
    for (let i1 in this._rawStrokes) {
      this._ctx.strokeStyle = this.options.strokeColor
      this._ctx.setLineDash([])
      this._ctx.lineWidth = this.strokeWidth
      this._ctx.beginPath()
      this._ctx.moveTo(this._rawStrokes[i1][0][0], this._rawStrokes[i1][0][1])
      let len = this._rawStrokes[i1].length
      for (let i2 = 0; i2 < len - 1; i2++) {
        this._ctx.lineTo(this._rawStrokes[i1][i2][0], this._rawStrokes[i1][i2][1])
        this._ctx.stroke()
      }
      this._ctx.lineTo(this._rawStrokes[i1][len - 1][0], this._rawStrokes[i1][len - 1][1])
      this._ctx.stroke()
    }
    if (!this._overlay) {
      return
    }
    if (this._showBoundary) {
      this._ctx.strokeStyle = 'blue'
      this._ctx.setLineDash([1, 1])
      this._ctx.lineWidth = 0.5
      this._ctx.beginPath()
      this._ctx.moveTo(this._overlay.left, this._overlay.top)
      this._ctx.lineTo(this._overlay.right, this._overlay.top)
      this._ctx.stroke()
      this._ctx.lineTo(this._overlay.right, this._overlay.bottom)
      this._ctx.stroke()
      this._ctx.lineTo(this._overlay.left, this._overlay.bottom)
      this._ctx.stroke()
      this._ctx.lineTo(this._overlay.left, this._overlay.top)
      this._ctx.stroke()
    }
    if (this._showSubstrokes) {
      for (let six = 0; six != this._overlay.xStrokes.length; ++six) {
        let xstroke = this._overlay.xStrokes[six]
        this._ctx.strokeStyle = 'red'
        this._ctx.setLineDash([])
        this._ctx.lineWidth = 1
        this._ctx.beginPath()
        this._ctx.moveTo(xstroke[0][0], xstroke[0][1])
        this._ctx.arc(xstroke[0][0], xstroke[0][1], 3, 0, 2 * Math.PI, true)
        this._ctx.fillStyle = 'red'
        this._ctx.fill()
        for (let i = 1; i < xstroke.length; ++i) {
          this._ctx.lineTo(xstroke[i][0], xstroke[i][1])
          this._ctx.stroke()
          this._ctx.beginPath()
          this._ctx.arc(xstroke[i][0], xstroke[i][1], 3, 0, 2 * Math.PI, true)
          this._ctx.fillStyle = 'red'
          this._ctx.fill()
        }
      }
    }
    if (this._showControlMedians && this._overlay.yStrokes) {
      for (let six = 0; six != this._overlay.yStrokes.length; ++six) {
        let ystroke = this._overlay.yStrokes[six]
        this._ctx.strokeStyle = '#e6cee6'
        this._ctx.setLineDash([])
        this._ctx.lineWidth = this.strokeWidth
        this._ctx.beginPath()
        this._ctx.moveTo(ystroke[0][0], ystroke[0][1])
        for (let i = 1; i < ystroke.length; ++i) {
          this._ctx.lineTo(ystroke[i][0], ystroke[i][1])
          this._ctx.stroke()
        }
      }
    }
    if (this._overlay.zStrokes) {
      for (let six = 0; six != this._overlay.zStrokes.length; ++six) {
        let xstroke = this._overlay.zStrokes[six]
        this._ctx.strokeStyle = 'green'
        this._ctx.setLineDash([])
        this._ctx.lineWidth = 1
        this._ctx.beginPath()
        this._ctx.moveTo(xstroke[0][0], xstroke[0][1])
        this._ctx.arc(xstroke[0][0], xstroke[0][1], 3, 0, 2 * Math.PI, true)
        this._ctx.fillStyle = 'green'
        this._ctx.fill()
        for (let i = 1; i < xstroke.length; ++i) {
          this._ctx.lineTo(xstroke[i][0], xstroke[i][1])
          this._ctx.stroke()
          this._ctx.beginPath()
          this._ctx.arc(xstroke[i][0], xstroke[i][1], 3, 0, 2 * Math.PI, true)
          this._ctx.fillStyle = 'green'
          this._ctx.fill()
        }
      }
    }
  }

  clearCanvas () {
    this._rawStrokes.length = 0
  }

  undoStroke () {
    if (this._rawStrokes.length == 0) return
    this._rawStrokes.length = this._rawStrokes.length - 1
  }

  cloneStrokes () {
    const res = []
    for (let i = 0; i != this._rawStrokes.length; ++i) {
      let stroke = []
      for (let j = 0; j != this._rawStrokes[i].length; ++j) {
        stroke.push([this._rawStrokes[i][j][0], this._rawStrokes[i][j][1]])
      }
      res.push(stroke)
    }
    return res
  }

  redraw () {
    this.drawClearCanvas()
    this.redrawInput()
  }

  enrich (overlay, showSubstrokes, showBoundary, showControlMedians) {
    this._overlay = overlay
    this._showBoundary = showBoundary
    this._showSubstrokes = showSubstrokes
    this._showControlMedians = showControlMedians
    this.drawClearCanvas()
    this.redrawInput()
  }

  onCanvasMouseMove (e) {
    if (!this.clicking) {
      return
    }
    const x = e.pageX - this.getOffsetLeft(this._canvas)
    const y = e.pageY - this.getOffsetTop(this._canvas)
    this.dragClick(x, y)
  }

  onCanvasMouseDown (e) {
    const x = e.pageX - this.getOffsetLeft(this._canvas)
    const y = e.pageY - this.getOffsetTop(this._canvas)
    this.startClick(x, y)
  }

  onCanvasMouseUp  (e) {
    const x = e.pageX - this.getOffsetLeft(this._canvas)
    const y = e.pageY - this.getOffsetTop(this._canvas)
    this.endClick(x, y)
  }
  onCanvasTouchMove  (e) {
    if (!this.clicking) {
      return
    }
    e.preventDefault()
    let x = e.touches[0].pageX - this.getOffsetLeft(this._canvas)
    this.lastTouchX = x
    let y = e.touches[0].pageY - this.getOffsetTop(this._canvas)
    this.lastTouchY = y
    this.dragClick(x, y)
  }

  onCanvasTouchStart  (e) {
    e.preventDefault()
    document.activeElement.blur()
    let x = e.touches[0].pageX - this.getOffsetLeft(this._canvas)
    let y = e.touches[0].pageY - this.getOffsetTop(this._canvas)
    this.startClick(x, y)
  }

  onCanvasTouchEnd  (e) {
    e.preventDefault()
    document.activeElement.blur()
    this.endClick(this.lastTouchX, this.lastTouchY)
    this.lastTouchX = this.lastTouchY = -1
  }

  DrawingBoard (elmHost, strokeFinished) {
    window.test = elmHost
    this._elmHost = elmHost
    this._strokeFinished = strokeFinished
    this.strokeWidth = 5
    this.clicking = false
    this.lastTouchX = -1
    this.lastTouchY = -1
    this._rawStrokes = []
    this._overlay = null
    this._showSubstrokes = false
    this._showBoundary = false
    this._showControlMedians = false
    let canvas = document.querySelector('canvas')
    if (!canvas) {
      canvas = document.createElement('canvas')
      canvas.className = 'stroke-input-canvas'
      canvas.width = this._elmHost.clientWidth
      canvas.height = this._elmHost.clientHeight
      this._elmHost.appendChild(canvas)
    } else {
      canvas.width = this._elmHost.clientWidth
      canvas.height = this._elmHost.clientHeight
    }
    this._canvas = canvas
    this._ctx = this._canvas.getContext('2d')
    this._canvas.addEventListener('mousemove', this.onCanvasMouseMove)
    this._canvas.addEventListener('mousedown', this.onCanvasMouseDown)
    this._canvas.addEventListener('mouseup', this.onCanvasMouseUp)
    this._canvas.addEventListener('touchmove', this.onCanvasTouchMove)
    this._canvas.addEventListener('touchstart', this.onCanvasTouchStart)
    this._canvas.addEventListener('touchend', this.onCanvasTouchEnd)
    this.drawClearCanvas()
    return this
  }

  init (key, data) {
    if (!this.data[key]) {
      this.data[key] = data
      this.data[key].substrokes = this.decodeCompact(data.substrokes)
    }
  }

  findSlot (score) {
    let ix
    for (ix = 0; ix < this._count; ++ix) {
      if (this._matches[ix].score < score) {
        return ix
      }
    }
    return ix
  }

  removeExistingLower (match) {
    let ix = -1
    for (let i = 0; i != this._count; ++i) {
      if (this._matches[i].character == match.character) {
        ix = i
        break
      }
    }
    if (ix == -1) {
      return false
    } else if (match.score <= this._matches[ix].score) {
      return true
    }
    for (let i = ix; i < this._matches.length - 1; ++i) {
      this._matches[i] = this._matches[i + 1]
    }
    --this._count
    return false
  }

  doFileMatch (match) {
    if ((this._count == this._matches.length && match.score <= this._matches[this._matches.length - 1].score) || this.removeExistingLower(match)) {
      return
    }
    let pos = this.findSlot(match.score)
    for (let i = this._matches.length - 1; i > pos; --i) {
      this._matches[i] = this._matches[i - 1]
    }
    this._matches[pos] = match
    if (this._count < this._matches.length) {
      ++this._count
    }
  }

  doGetMatches () {
    return this._matches.slice(0, this._count)
  }

  MatchCollector (limit) {
    this._count = 0
    this._matches = []
    for (let i = 0; i != limit; ++i) {
      this._matches.push(null)
    }
    return {
      fileMatch: this.doFileMatch,
      getMatches: this.doGetMatches
    }
  }

  doMatch (inputChar, limit, ready) {
    console.time('doMatch')
    this._charsChecked = 0
    this._subStrokesCompared = 0
    let matchCollector = this.MatchCollector(limit)
    if (inputChar.analyzedStrokes.length == 0) {
      console.timeEnd('doMatch')
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
    let strokeRange = this.getStrokesRange(strokeCount)
    let minimumStrokes = Math.max(strokeCount - strokeRange, 1)
    let maximumStrokes = Math.min(strokeCount + strokeRange, this.MAX_CHARACTER_STROKE_COUNT)
    let subStrokesRange = this.getSubStrokesRange(subStrokeCount)
    let minSubStrokes = Math.max(subStrokeCount - subStrokesRange, 1)
    let maxSubStrokes = Math.min(subStrokeCount + subStrokesRange, this.MAX_CHARACTER_SUB_STROKE_COUNT)
    for (let cix = 0; cix != this._repo.length; ++cix) {
      let repoChar = this._repo[cix]
      let cmpStrokeCount = repoChar[1]
      let cmpSubStrokes = repoChar[2]
      // If looseness is zero, require exact stroke count match only
      if ((this._looseness === 0 && cmpStrokeCount !== strokeCount) || (cmpStrokeCount < minimumStrokes || cmpStrokeCount > maximumStrokes || cmpSubStrokes.length < minSubStrokes || cmpSubStrokes.length > maxSubStrokes)) {
        continue
      }
      // console.time('matchOne')
      let match = this.matchOne(strokeCount, inputSubStrokes, subStrokesRange, repoChar)
      // console.timeEnd('matchOne')
      matchCollector.fileMatch(match)
    }
    console.timeEnd('doMatch')
    ready(matchCollector.getMatches())
  }
  getStrokesRange (strokeCount) {
    if (this._looseness == 0) {
      return 0
    } else if (this._looseness == 1) {
      return this.MAX_CHARACTER_STROKE_COUNT
    }
    let ctrl1X = 0.35
    let ctrl1Y = strokeCount * 0.4
    let ctrl2X = 0.6
    let ctrl2Y = strokeCount
    let curve = this.CubicCurve2D(0, 0, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, 1, this.MAX_CHARACTER_STROKE_COUNT)
    const t = curve.getFirstSolutionForX(this._looseness)
    return Math.round(curve.getYOnCurve(t))
  }

  getSubStrokesRange (subStrokeCount) {
    if (this._looseness == 1.0) {
      return this.MAX_CHARACTER_SUB_STROKE_COUNT
    }
    let y0 = subStrokeCount * 0.25
    let ctrl1X = 0.4
    let ctrl1Y = 1.5 * y0
    let ctrl2X = 0.75
    let ctrl2Y = 1.5 * ctrl1Y
    let curve = this.CubicCurve2D(0, y0, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, 1, this.MAX_CHARACTER_SUB_STROKE_COUNT)
    let t = curve.getFirstSolutionForX(this._looseness)
    return Math.round(curve.getYOnCurve(t))
  }

  buildScoreMatrix () {
    let dim = this.MAX_CHARACTER_SUB_STROKE_COUNT + 1
    let res = []
    for (let i = 0; i < dim; i++) {
      res.push([])
      for (let j = 0; j < dim; j++) {
        res[i].push(0)
      }
    }
    for (let i = 0; i < dim; i++) {
      let penalty = -this.AVG_SUBSTROKE_LENGTH * this.SKIP_PENALTY_MULTIPLIER * i
      res[i][0] = penalty
      res[0][i] = penalty
    }
    return res
  }

  matchOne (inputStrokeCount, inputSubStrokes, subStrokesRange, repoChar) {
    // console.time('computeMatchScore')
    ++this._charsChecked
    let score = this.computeMatchScore(inputStrokeCount, inputSubStrokes, subStrokesRange, repoChar)
    // console.timeEnd('computeMatchScore')
    if (inputStrokeCount == repoChar[1] && inputStrokeCount < this.CORRECT_NUM_STROKES_CAP) {
      const bonus = (this.CORRECT_NUM_STROKES_BONUS * Math.max(this.CORRECT_NUM_STROKES_CAP - inputStrokeCount, 0)) / this.CORRECT_NUM_STROKES_CAP
      score += bonus * score
    }
    return this.CharacterMatch(repoChar[0], score)
  }

  computeMatchScore (strokeCount, inputSubStrokes, subStrokesRange, repoChar) {
    // console.time('computeMatchScore-inner')
    // Memoization caches for direction and length scores
    const directionScoreCache = {}
    const lengthScoreCache = {}
    for (let x = 0; x < inputSubStrokes.length; x++) {
      const inputDirection = inputSubStrokes[x].direction
      const inputLength = inputSubStrokes[x].length
      const inputCenter = [inputSubStrokes[x].centerX, inputSubStrokes[x].centerY]
      for (let y = 0; y < repoChar[2]; y++) {
        let newScore = Number.NEGATIVE_INFINITY
        if (Math.abs(x - y) <= subStrokesRange) {
          let compareDirection = this._sbin[repoChar[3] + y * 3]
          let compareLength = this._sbin[repoChar[3] + y * 3 + 1]
          let compareCenter = null
          const bCenter = this._sbin[repoChar[3] + y * 3 + 2]
          if (bCenter > 0)
            compareCenter = [(bCenter & 0xf0) >>> 4, bCenter & 0x0f]
          const skip1Score = this._scoreMatrix[x][y + 1] - (inputLength / 256) * this.SKIP_PENALTY_MULTIPLIER
          const skip2Score = this._scoreMatrix[x + 1][y] - (compareLength / 256) * this.SKIP_PENALTY_MULTIPLIER
          const skipScore = Math.max(skip1Score, skip2Score)
          // Memoize direction and length scores
          const dirKey = `${inputDirection},${compareDirection},${inputLength}`
          const lenKey = `${inputLength},${compareLength}`
          let directionScore = directionScoreCache[dirKey]
          if (directionScore === undefined) {
            directionScore = this.getDirectionScore(inputDirection, compareDirection, inputLength)
            directionScoreCache[dirKey] = directionScore
          }
          let lengthScore = lengthScoreCache[lenKey]
          if (lengthScore === undefined) {
            lengthScore = this.getLengthScore(inputLength, compareLength)
            lengthScoreCache[lenKey] = lengthScore
          }
          let matchScore = directionScore * lengthScore
          if (compareCenter) {
            const dx = inputCenter[0] - compareCenter[0]
            const dy = inputCenter[1] - compareCenter[1]
            const closeness = this.POS_SCORE_TABLE[dx * dx + dy * dy]
            if (matchScore > 0) {
              matchScore *= closeness
            } else {
              matchScore /= closeness
            }
          }
          const previousScore = this._scoreMatrix[x][y]
          newScore = Math.max(previousScore + matchScore, skipScore)
        }
        this._scoreMatrix[x + 1][y + 1] = newScore
      }
    }
    // console.timeEnd('computeMatchScore-inner')
    return this._scoreMatrix[inputSubStrokes.length][repoChar[2]]
  }

  // computeSubStrokeScore is now inlined in computeMatchScore for memoization efficiency

  initScoreTables () {
    const dirCurve = this.CubicCurve2D(0,1.0,0.5,1.0,0.25,-2.0,1.0,1.0)
    this.DIRECTION_SCORE_TABLE = this.initCubicCurveScoreTable(dirCurve, 256)
    const lenCurve = this.CubicCurve2D(0,0,0.25,1.0,0.75,1.0,1.0,1.0)
    this.LENGTH_SCORE_TABLE = this.initCubicCurveScoreTable(lenCurve, 129)
    this.POS_SCORE_TABLE = []
    for (let i = 0; i <= 450; ++i) {
      this.POS_SCORE_TABLE.push(1 - Math.sqrt(i) / 22)
    }
  }

  initCubicCurveScoreTable (curve, numSamples) {
    const x1 = curve.x1()
    const x2 = curve.x2()
    const range = x2 - x1
    let x = x1
    const xInc = range / numSamples
    const scoreTable = []
    for (let i = 0; i < numSamples; i++) {
      const t = curve.getFirstSolutionForX(Math.min(x, x2))
      scoreTable.push(curve.getYOnCurve(t))
      x += xInc
    }
    return scoreTable
  }

  getDirectionScore (direction1, direction2, inputLength) {
    const theta = Math.abs(direction1 - direction2)
    const directionScore = this.DIRECTION_SCORE_TABLE[theta]
    if (inputLength < 64) {
      const shortLengthBonusMax = Math.min(1.0, 1.0 - directionScore)
      const shortLengthBonus = shortLengthBonusMax * (1 - inputLength / 64)
      return directionScore + shortLengthBonus
    }
    return directionScore
  }

  getLengthScore (length1, length2) {
    const ratio = length1 > length2 ? Math.round((length2 << 7) / length1) : Math.round((length1 << 7) / length2)
    return this.LENGTH_SCORE_TABLE[ratio]
  }

  Matcher (dataName, looseness) {
    this._looseness = looseness || this.DEFAULT_LOOSENESS
    this._repo = this.data[dataName].chars
    this._sbin = this.data[dataName].substrokes
    this._scoreMatrix = this.buildScoreMatrix()
    this.DIRECTION_SCORE_TABLE = []
    this.LENGTH_SCORE_TABLE = []
    this.POS_SCORE_TABLE = []
    this.initScoreTables()
    return {doMatch: this.doMatch}
  }

  StrokeInputOverlay (top,right,bottom,left,xStrokes,yStrokes,zStrokes) {
    this.top = top
    this.right = right
    this.bottom = bottom
    this.left = left
    this.xStrokes = xStrokes
    this.yStrokes = yStrokes
    this.zStrokes = zStrokes
  }

  SubStroke (direction, length, centerX, centerY) {
    return {
      direction: direction,
      length: length,
      centerX: centerX,
      centerY: centerY
    }
  }
}

export default HanziLookup
