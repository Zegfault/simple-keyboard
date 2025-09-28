
class DrawingBoard {
  constructor (options, elmHost, strokeFinished) {
    this.options = options
    this._elmHost = elmHost
    this._strokeFinished = strokeFinished
    this.strokeWidth = 5
    this.clicking = false
    this.lastTouchX = -1
    this.lastTouchY = -1
    this.tstamp = null
    this.lastPt = null
    this._rawStrokes = []
    this._currentStroke = null
    this._overlay = null
    this._showSubstrokes = false
    this._showBoundary = false
    this._showControlMedians = false

    this._canvas = this._elmHost.querySelector('canvas')
    if (!this._canvas) {
      this._canvas = document.createElement('canvas')
      this._canvas.className = 'stroke-input-canvas'
      this._canvas.width = this._elmHost.clientWidth
      this._canvas.height = this._elmHost.clientHeight
      this._elmHost.appendChild(this._canvas)
    } else {
      this._canvas.width = this._elmHost.clientWidth
      this._canvas.height = this._elmHost.clientHeight
    }
    this._ctx = this._canvas.getContext('2d')

    this._canvas.addEventListener('mousemove', (e) => {
      if (!this.clicking) return
      const { x, y } = this.getXY(e)
      this.dragClick(x, y)
    })
    this._canvas.addEventListener('mousedown', (e) => {
      const { x, y } = this.getXY(e)
      this.startClick(x, y)
    })
    this._canvas.addEventListener('mouseup', (e) => {
      const { x, y } = this.getXY(e)
      this.endClick(x, y)
    })
    this._canvas.addEventListener('touchmove', (e) => {
      if (!this.clicking) return
      e.preventDefault()
      const rect = this._canvas.getBoundingClientRect()
      const x = e.touches[0].clientX - rect.left
      this.lastTouchX = x
      const y = e.touches[0].clientY - rect.top
      this.lastTouchY = y
      this.dragClick(x, y)
    })
    this._canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      document.activeElement.blur()
      const { x, y } = this.getXY(e)
      this.startClick(x, y)
    })
    this._canvas.addEventListener('touchend', (e) => {
      e.preventDefault()
      document.activeElement.blur()
      this.endClick(this.lastTouchX, this.lastTouchY)
      this.lastTouchX = this.lastTouchY = -1
    })

    this.drawClearCanvas()
  }

  getXY (e) {
    const rect = this._canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    return { x, y }
  }

  drawClearCanvas () {
    this._ctx.clearRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.height)
    if (this.options.drawingGrid) {
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
    if (this._rawStrokes.length == 0) {
      return
    }
    this._rawStrokes.length = this._rawStrokes.length - 1
  }

  cloneStrokes () {
    let res = []
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
}

export default DrawingBoard
