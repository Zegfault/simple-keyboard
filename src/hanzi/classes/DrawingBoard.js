function DrawingBoard (options, elmHost, strokeFinished) {
  'use strict'
  let _elmHost = elmHost
  let _strokeFinised = strokeFinished
  let _canvas
  let _ctx
  let strokeWidth = 5
  let clicking = false
  let lastTouchX = -1
  let lastTouchY = -1
  let tstamp
  let lastPt
  let _rawStrokes = []
  let _currentStroke = null
  let _overlay = null
  let _showSubstrokes = false
  let _showBoundary = false
  let _showControlMedians = false
  _canvas = _elmHost.querySelector('canvas')
  if (!_canvas) {
    _canvas = document.createElement('canvas')
    _canvas.className = 'stroke-input-canvas'
    _canvas.width = _elmHost.clientWidth
    _canvas.height = _elmHost.clientHeight
    _elmHost.appendChild(_canvas)
  } else {
    _canvas.width = _elmHost.clientWidth
    _canvas.height = _elmHost.clientHeight
  }
  _ctx = _canvas.getContext('2d')

  const getXY = function (e) {
    const rect = _canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    return { x, y }
  }
  _canvas.addEventListener('mousemove', function (e) {
    if (!clicking) return
    const { x, y } = getXY(e)
    dragClick(x, y)
  })
  _canvas.addEventListener('mousedown', function (e) {
    const { x, y } = getXY(e)
    startClick(x, y)
  })
  _canvas.addEventListener('mouseup', function (e) {
    const { x, y } = getXY(e)
    endClick(x, y)
  })
  _canvas.addEventListener('touchmove', function (e) {
    if (!clicking) return
    e.preventDefault()
    const rect = _canvas.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    lastTouchX = x
    const y = e.touches[0].clientY - rect.top
    lastTouchY = y
    dragClick(x, y)
  })
  _canvas.addEventListener('touchstart', function (e) {
    e.preventDefault()
    document.activeElement.blur()
    const { x, y } = getXY(e)
    startClick(x, y)
  })
  _canvas.addEventListener('touchend', function (e) {
    e.preventDefault()
    document.activeElement.blur()
    endClick(lastTouchX, lastTouchY)
    lastTouchX = lastTouchY = -1
  })

  drawClearCanvas()
  function drawClearCanvas () {
    _ctx.clearRect(0, 0, _ctx.canvas.width, _ctx.canvas.height)
    if (options.drawingGrid) {
      _ctx.setLineDash([1, 1])
      _ctx.lineWidth = 0.5
      _ctx.strokeStyle = 'grey'
      _ctx.beginPath()
      _ctx.moveTo(0, 0)
      _ctx.lineTo(_ctx.canvas.width, 0)
      _ctx.lineTo(_ctx.canvas.width, _ctx.canvas.height)
      _ctx.lineTo(0, _ctx.canvas.height)
      _ctx.lineTo(0, 0)
      _ctx.stroke()
      _ctx.beginPath()
      _ctx.moveTo(0, 0)
      _ctx.lineTo(_ctx.canvas.width, _ctx.canvas.height)
      _ctx.stroke()
      _ctx.beginPath()
      _ctx.moveTo(_ctx.canvas.width, 0)
      _ctx.lineTo(0, _ctx.canvas.height)
      _ctx.stroke()
      _ctx.beginPath()
      _ctx.moveTo(_ctx.canvas.width / 2, 0)
      _ctx.lineTo(_ctx.canvas.width / 2, _ctx.canvas.height)
      _ctx.stroke()
      _ctx.beginPath()
      _ctx.moveTo(0, _ctx.canvas.height / 2)
      _ctx.lineTo(_ctx.canvas.width, _ctx.canvas.height / 2)
      _ctx.stroke()
    }
  }

  function startClick (x, y) {
    clicking = true
    _currentStroke = []
    lastPt = [x, y]
    _currentStroke.push(lastPt)
    _ctx.strokeStyle = options.strokeColor
    _ctx.setLineDash([])
    _ctx.lineWidth = strokeWidth
    _ctx.beginPath()
    _ctx.moveTo(x, y)
    tstamp = new Date()
  }

  function dragClick (x, y) {
    if (new Date().getTime() - tstamp < 50) {
      return
    }
    tstamp = new Date()
    let pt = [x, y]
    if (pt[0] == lastPt[0] && pt[1] == lastPt[1]) {
      return
    }
    _currentStroke.push(pt)
    lastPt = pt
    _ctx.lineTo(x, y)
    _ctx.stroke()
  }

  function endClick (x, y) {
    clicking = false
    if (x == -1) {
      return
    }
    _ctx.lineTo(x, y)
    _ctx.stroke()
    _currentStroke.push([x, y])
    _rawStrokes.push(_currentStroke)
    _currentStroke = []
    if (_strokeFinised) {
      _strokeFinised()
    }
  }

  function redrawInput () {
    for (let i1 in _rawStrokes) {
      _ctx.strokeStyle = options.strokeColor
      _ctx.setLineDash([])
      _ctx.lineWidth = strokeWidth
      _ctx.beginPath()
      _ctx.moveTo(_rawStrokes[i1][0][0], _rawStrokes[i1][0][1])
      let len = _rawStrokes[i1].length
      for (let i2 = 0; i2 < len - 1; i2++) {
        _ctx.lineTo(_rawStrokes[i1][i2][0], _rawStrokes[i1][i2][1])
        _ctx.stroke()
      }
      _ctx.lineTo(_rawStrokes[i1][len - 1][0], _rawStrokes[i1][len - 1][1])
      _ctx.stroke()
    }
    if (!_overlay) {
      return
    }
    if (_showBoundary) {
      _ctx.strokeStyle = 'blue'
      _ctx.setLineDash([1, 1])
      _ctx.lineWidth = 0.5
      _ctx.beginPath()
      _ctx.moveTo(_overlay.left, _overlay.top)
      _ctx.lineTo(_overlay.right, _overlay.top)
      _ctx.stroke()
      _ctx.lineTo(_overlay.right, _overlay.bottom)
      _ctx.stroke()
      _ctx.lineTo(_overlay.left, _overlay.bottom)
      _ctx.stroke()
      _ctx.lineTo(_overlay.left, _overlay.top)
      _ctx.stroke()
    }
    if (_showSubstrokes) {
      for (let six = 0; six != _overlay.xStrokes.length; ++six) {
        let xstroke = _overlay.xStrokes[six]
        _ctx.strokeStyle = 'red'
        _ctx.setLineDash([])
        _ctx.lineWidth = 1
        _ctx.beginPath()
        _ctx.moveTo(xstroke[0][0], xstroke[0][1])
        _ctx.arc(xstroke[0][0], xstroke[0][1], 3, 0, 2 * Math.PI, true)
        _ctx.fillStyle = 'red'
        _ctx.fill()
        for (let i = 1; i < xstroke.length; ++i) {
          _ctx.lineTo(xstroke[i][0], xstroke[i][1])
          _ctx.stroke()
          _ctx.beginPath()
          _ctx.arc(xstroke[i][0], xstroke[i][1], 3, 0, 2 * Math.PI, true)
          _ctx.fillStyle = 'red'
          _ctx.fill()
        }
      }
    }
    if (_showControlMedians && _overlay.yStrokes) {
      for (let six = 0; six != _overlay.yStrokes.length; ++six) {
        let ystroke = _overlay.yStrokes[six]
        _ctx.strokeStyle = '#e6cee6'
        _ctx.setLineDash([])
        _ctx.lineWidth = strokeWidth
        _ctx.beginPath()
        _ctx.moveTo(ystroke[0][0], ystroke[0][1])
        for (let i = 1; i < ystroke.length; ++i) {
          _ctx.lineTo(ystroke[i][0], ystroke[i][1])
          _ctx.stroke()
        }
      }
    }
    if (_overlay.zStrokes) {
      for (let six = 0; six != _overlay.zStrokes.length; ++six) {
        let xstroke = _overlay.zStrokes[six]
        _ctx.strokeStyle = 'green'
        _ctx.setLineDash([])
        _ctx.lineWidth = 1
        _ctx.beginPath()
        _ctx.moveTo(xstroke[0][0], xstroke[0][1])
        _ctx.arc(xstroke[0][0], xstroke[0][1], 3, 0, 2 * Math.PI, true)
        _ctx.fillStyle = 'green'
        _ctx.fill()
        for (let i = 1; i < xstroke.length; ++i) {
          _ctx.lineTo(xstroke[i][0], xstroke[i][1])
          _ctx.stroke()
          _ctx.beginPath()
          _ctx.arc(xstroke[i][0], xstroke[i][1], 3, 0, 2 * Math.PI, true)
          _ctx.fillStyle = 'green'
          _ctx.fill()
        }
      }
    }
  }

  return {
    clearCanvas: function () {
      _rawStrokes.length = 0
    },
    undoStroke: function () {
      if (_rawStrokes.length == 0) {
        return
      }
      _rawStrokes.length = _rawStrokes.length - 1
    },
    cloneStrokes: function () {
      let res = []
      for (let i = 0; i != _rawStrokes.length; ++i) {
        let stroke = []
        for (let j = 0; j != _rawStrokes[i].length; ++j) {
          stroke.push([_rawStrokes[i][j][0], _rawStrokes[i][j][1]])
        }
        res.push(stroke)
      }
      return res
    },
    redraw: function () {
      drawClearCanvas()
      redrawInput()
    },
    enrich: function (overlay, showSubstrokes, showBoundary, showControlMedians) {
      _overlay = overlay
      _showBoundary = showBoundary
      _showSubstrokes = showSubstrokes
      _showControlMedians = showControlMedians
      drawClearCanvas()
      redrawInput()
    }
  }
}

export default DrawingBoard
