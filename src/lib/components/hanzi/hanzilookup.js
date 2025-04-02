/* eslint no-redeclare: "off" */
/* eslint no-undef: "off" */
const $ = require("jquery");

const HanziLookup = {};

HanziLookup.options = {
  drawingGrid: false,
  strokeColor: "red"
};

HanziLookup.AnalyzedCharacter = function(rawStrokes) {
  "use strict";

  // Magic constants used in decomposition of a stroke into substrokes
  var MIN_SEGMENT_LENGTH = 12.5;
  var MAX_LOCAL_LENGTH_RATIO = 1.1;
  var MAX_RUNNING_LENGTH_RATIO = 1.09;

  // Bounding rectangle
  var _top = Number.MAX_SAFE_INTEGER;
  var _bottom = Number.MIN_SAFE_INTEGER;
  var _left = Number.MAX_SAFE_INTEGER;
  var _right = Number.MIN_SAFE_INTEGER;

  var _analyzedStrokes = [];
  var _subStrokeCount = 0;

  // Calculate bounding rectangle
  getBoundingRect(rawStrokes);
  // Build analyzed strokes
  buildAnalyzedStrokes(rawStrokes);

  // Aaand, the result is :)
  this.top = _top <= 256 ? _top : 0;
  this.bottom = _bottom >= 0 ? _bottom : 256;
  this.left = _left <= 256 ? _left : 0;
  this.right = _right >= 0 ? _right : 256;
  this.analyzedStrokes = _analyzedStrokes;
  this.subStrokeCount = _subStrokeCount;

  // Calculates rectangle that bounds all points in raw strokes.
  function getBoundingRect(rawStrokes) {
    for (var i = 0; i != rawStrokes.length; ++i) {
      for (var j = 0; j != rawStrokes[i].length; ++j) {
        var pt = rawStrokes[i][j];
        if (pt[0] < _left) _left = pt[0];
        if (pt[0] > _right) _right = pt[0];
        if (pt[1] < _top) _top = pt[1];
        if (pt[1] > _bottom) _bottom = pt[1];
      }
    }
  }

  // Gets distance between two points
  // a and b are two-dimensional arrays for X, Y
  function dist(a, b) {
    var dx = a[0] - b[0];
    var dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Gets normalized distance between two points
  // a and b are two-dimensional arrays for X, Y
  // Normalized based on bounding rectangle
  function normDist(a, b) {
    var width = _right - _left;
    var height = _bottom - _top;
    // normalizer is a diagonal along a square with sides of size the larger dimension of the bounding box
    var dimensionSquared = width > height ? width * width : height * height;
    var normalizer = Math.sqrt(dimensionSquared + dimensionSquared);
    var distanceNormalized = dist(a, b) / normalizer;
    // Cap at 1 (...why is this needed??)
    return Math.min(distanceNormalized, 1);
  }

  // Gets direction, in radians, from point a to b
  // a and b are two-dimensional arrays for X, Y
  // 0 is to the right, PI / 2 is up, etc.
  function dir(a, b) {
    var dx = a[0] - b[0];
    var dy = a[1] - b[1];
    var dir = Math.atan2(dy, dx);
    return Math.PI - dir;
  }

  // Calculates array with indexes of pivot points in raw stroke
  function getPivotIndexes(points) {
    // One item for each point: true if it's a pivot
    var markers = [];
    for (var i = 0; i != points.length; ++i) markers.push(false);

    // Cycle variables
    var prevPtIx = 0;
    var firstPtIx = 0;
    var pivotPtIx = 1;

    // The first point of a Stroke is always a pivot point.
    markers[0] = true;

    // localLength keeps track of the immediate distance between the latest three points.
    // We can use localLength to find an abrupt change in substrokes, such as at a corner.
    // We do this by checking localLength against the distance between the first and last
    // of the three points. If localLength is more than a certain amount longer than the
    // length between the first and last point, then there must have been a corner of some kind.
    var localLength = dist(points[firstPtIx], points[pivotPtIx]);

    // runningLength keeps track of the length between the start of the current SubStroke
    // and the point we are currently examining.  If the runningLength becomes a certain
    // amount longer than the straight distance between the first point and the current
    // point, then there is a new SubStroke.  This accounts for a more gradual change
    // from one SubStroke segment to another, such as at a longish curve.
    var runningLength = localLength;

    // Cycle through rest of stroke points.
    for (var i = 2; i < points.length; ++i) {
      var nextPoint = points[i];

      // pivotPoint is the point we're currently examining to see if it's a pivot.
      // We get the distance between this point and the next point and add it
      // to the length sums we're using.
      var pivotLength = dist(points[pivotPtIx], nextPoint);
      localLength += pivotLength;
      runningLength += pivotLength;

      // Check the lengths against the ratios.  If the lengths are a certain among
      // longer than a straight line between the first and last point, then we
      // mark the point as a pivot.
      var distFromPrevious = dist(points[prevPtIx], nextPoint);
      var distFromFirst = dist(points[firstPtIx], nextPoint);
      if (
        localLength > MAX_LOCAL_LENGTH_RATIO * distFromPrevious ||
        runningLength > MAX_RUNNING_LENGTH_RATIO * distFromFirst
      ) {
        // If the previous point was a pivot and was very close to this point,
        // which we are about to mark as a pivot, then unmark the previous point as a pivot.
        if (
          markers[prevPtIx] &&
          dist(points[prevPtIx], points[pivotPtIx]) < MIN_SEGMENT_LENGTH
        ) {
          markers[prevPtIx] = false;
        }
        markers[pivotPtIx] = true;
        runningLength = pivotLength;
        firstPtIx = pivotPtIx;
      }
      localLength = pivotLength;
      prevPtIx = pivotPtIx;
      pivotPtIx = i;
    }

    // last point (currently referenced by pivotPoint) has to be a pivot
    markers[pivotPtIx] = true;
    // Point before the final point may need to be handled specially.
    // Often mouse action will produce an unintended small segment at the end.
    // We'll want to unmark the previous point if it's also a pivot and very close to the lat point.
    // However if the previous point is the first point of the stroke, then don't unmark it, because
    // then we'd only have one pivot.
    if (
      markers[prevPtIx] &&
      dist(points[prevPtIx], points[pivotPtIx]) < MIN_SEGMENT_LENGTH &&
      prevPtIx != 0
    ) {
      markers[prevPtIx] = false;
    }

    // Return result in the form of an index array: includes indexes where marker is true
    var res = [];
    for (var i = 0; i != markers.length; ++i) {
      if (markers[i]) res.push(i);
    }
    return res;
  }

  function getNormCenter(a, b) {
    var x = (a[0] + b[0]) / 2;
    var y = (a[1] + b[1]) / 2;
    var side;
    // Bounding rect is landscape
    if (_right - _left > _bottom - _top) {
      side = _right - _left;
      var height = _bottom - _top;
      x = x - _left;
      y = y - _top + (side - height) / 2;
    }
    // Portrait
    else {
      side = _bottom - _top;
      var width = _right - _left;
      x = x - _left + (side - width) / 2;
      y = y - _top;
    }
    return [x / side, y / side];
  }

  // Builds array of substrokes from stroke's points, pivots, and character's bounding rectangle
  function buildSubStrokes(points, pivotIndexes) {
    var res = [];
    var prevIx = 0;
    for (var i = 0; i != pivotIndexes.length; ++i) {
      var ix = pivotIndexes[i];
      if (ix == prevIx) continue;
      var direction = dir(points[prevIx], points[ix]);
      direction = Math.round((direction * 256.0) / Math.PI / 2.0);
      if (direction == 256) direction = 0;
      var normLength = normDist(points[prevIx], points[ix]);
      normLength = Math.round(normLength * 255);
      var center = getNormCenter(points[prevIx], points[ix]);
      center[0] = Math.round(center[0] * 15);
      center[1] = Math.round(center[1] * 15);
      res.push(
        new HanziLookup.SubStroke(direction, normLength, center[0], center[1])
      );
      prevIx = ix;
    }
    return res;
  }

  // Analyze raw input, store result in _analyzedStrokes member.
  function buildAnalyzedStrokes(rawStrokes) {
    // Process each stroke
    for (var i = 0; i != rawStrokes.length; ++i) {
      // Identify pivot points
      var pivotIndexes = getPivotIndexes(rawStrokes[i]);
      // Abstract away substrokes
      var subStrokes = buildSubStrokes(rawStrokes[i], pivotIndexes);
      _subStrokeCount += subStrokes.length;
      // Store all this
      _analyzedStrokes.push(
        new HanziLookup.AnalyzedStroke(rawStrokes[i], pivotIndexes, subStrokes)
      );
    }
  }
};

HanziLookup.AnalyzedStroke = function(points, pivotIndexes, subStrokes) {
  "use strict";
  this.points = points;
  this.pivotIndexes = pivotIndexes;
  this.subStrokes = subStrokes;
};

HanziLookup.CharacterMatch = function(character, score) {
  "use strict";

  this.character = character;
  this.score = score;
};

HanziLookup.CubicCurve2D = function(
  x1,
  y1,
  ctrlx1,
  ctrly1,
  ctrlx2,
  ctrly2,
  x2,
  y2
) {
  "use strict";

  var _x1 = x1;
  var _y1 = y1;
  var _ctrlX1 = ctrlx1;
  var _ctrlY1 = ctrly1;
  var _ctrlX2 = ctrlx2;
  var _ctrlY2 = ctrly2;
  var _x2 = x2;
  var _y2 = y2;

  function getCubicAx() {
    return _x2 - _x1 - getCubicBx() - getCubicCx();
  }
  function getCubicAy() {
    return _y2 - _y1 - getCubicBy() - getCubicCy();
  }
  function getCubicBx() {
    return 3.0 * (_ctrlX2 - _ctrlX1) - getCubicCx();
  }
  function getCubicBy() {
    return 3.0 * (_ctrlY2 - _ctrlY1) - getCubicCy();
  }
  function getCubicCx() {
    return 3.0 * (_ctrlX1 - _x1);
  }
  function getCubicCy() {
    return 3.0 * (_ctrlY1 - _y1);
  }

  function doSolveForX(x) {
    var solutions = [];
    var a = getCubicAx();
    var b = getCubicBx();
    var c = getCubicCx();
    var d = _x1 - x;
    var f = ((3.0 * c) / a - (b * b) / (a * a)) / 3.0;
    var g =
      ((2.0 * b * b * b) / (a * a * a) -
        (9.0 * b * c) / (a * a) +
        (27.0 * d) / a) /
      27.0;
    var h = (g * g) / 4.0 + (f * f * f) / 27.0;
    // There is only one real root
    if (h > 0) {
      var u = 0 - g;
      var r = u / 2 + Math.pow(h, 0.5);
      var s6 = Math.pow(r, 0.333333333333333333333333333);
      var s8 = s6;
      var t8 = u / 2 - Math.pow(h, 0.5);
      var v7 = Math.pow(0 - t8, 0.33333333333333333333);
      var v8 = v7;
      var x3 = s8 - v8 - b / (3 * a);
      solutions.push(x3);
    }
    // All 3 roots are real and equal
    else if (f == 0.0 && g == 0.0 && h == 0.0) {
      solutions.push(-Math.pow(d / a, 1.0 / 3.0));
    }
    // All three roots are real (h <= 0)
    else {
      var i = Math.sqrt((g * g) / 4.0 - h);
      var j = Math.pow(i, 1.0 / 3.0);
      var k = Math.acos(-g / (2 * i));
      var l = j * -1.0;
      var m = Math.cos(k / 3.0);
      var n = Math.sqrt(3.0) * Math.sin(k / 3.0);
      var p = (b / (3.0 * a)) * -1.0;
      solutions.push(2.0 * j * Math.cos(k / 3.0) - b / (3.0 * a));
      solutions.push(l * (m + n) + p);
      solutions.push(l * (m - n) + p);
    }
    return solutions;
  }

  return {
    x1: function() {
      return _x1;
    },

    x2: function() {
      return _x2;
    },

    getYOnCurve: function(t) {
      var ay = getCubicAy();
      var by = getCubicBy();
      var cy = getCubicCy();
      var tSquared = t * t;
      var tCubed = t * tSquared;
      var y = ay * tCubed + by * tSquared + cy * t + _y1;
      return y;
    },

    solveForX: function(x) {
      return doSolveForX(x);
    },

    getFirstSolutionForX: function(x) {
      var solutions = doSolveForX(x);
      for (var i = 0; i != solutions.length; ++i) {
        var d = solutions[i];
        if (d >= -0.00000001 && d <= 1.00000001) {
          if (d >= 0.0 && d <= 1.0) return d;
          if (d < 0.0) return 0.0;
          return 1.0;
        }
      }
      return NaN;
    }
  };
};

HanziLookup.decodeCompact = function(base64) {
  "use strict";

  var chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  // Use a lookup table to find the index.
  var lookup = new Uint8Array(256);
  for (var i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  var bufferLength = base64.length * 0.75,
    len = base64.length,
    i,
    p = 0,
    encoded1,
    encoded2,
    encoded3,
    encoded4;

  if (base64[base64.length - 1] === "=") {
    bufferLength--;
    if (base64[base64.length - 2] === "=") {
      bufferLength--;
    }
  }

  var arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer);

  for (i = 0; i < len; i += 4) {
    encoded1 = lookup[base64.charCodeAt(i)];
    encoded2 = lookup[base64.charCodeAt(i + 1)];
    encoded3 = lookup[base64.charCodeAt(i + 2)];
    encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return bytes;
};

HanziLookup.DrawingBoard = function(elmHost, strokeFinished) {
  "use strict";

  var _elmHost = elmHost;
  var _strokeFinised = strokeFinished;
  var _canvas;
  var _ctx;

  // Global options ******************************
  // Width of strokes drawn on screen
  var strokeWidth = 5;

  // UI state
  var clicking = false;
  var lastTouchX = -1;
  var lastTouchY = -1;
  var tstamp;
  var lastPt;

  // An array of arrays; each element is the coordinate sequence for one stroke from the canvas
  // Where "stroke" is everything between button press - move - button release
  var _rawStrokes = [];

  // Canvas coordinates of each point in current stroke, in raw (unanalyzed) form.
  var _currentStroke = null;

  // Overlay. If null, no overlay.
  var _overlay = null;
  var _showSubstrokes = false;
  var _showBoundary = false;
  var _showControlMedians = false;

  // Initializes handwriting recognition (events etc.)
  _canvas = $(
    `<canvas class="stroke-input-canvas" width="${elmHost[0].clientWidth}" height="${elmHost[0].clientHeight}"></canvas>`
  );
  _elmHost.append(_canvas);
  _ctx = _canvas[0].getContext("2d");
  _canvas.mousemove(function(e) {
    if (!clicking) return;
    var x = e.pageX - $(this).offset().left;
    var y = e.pageY - $(this).offset().top;
    dragClick(x, y);
  });
  _canvas
    .mousedown(function(e) {
      var x = e.pageX - $(this).offset().left;
      var y = e.pageY - $(this).offset().top;
      startClick(x, y);
    })
    .mouseup(function(e) {
      var x = e.pageX - $(this).offset().left;
      var y = e.pageY - $(this).offset().top;
      endClick(x, y);
    });
  _canvas.bind("touchmove", function(e) {
    if (!clicking) return;
    e.preventDefault();
    var x = e.originalEvent.touches[0].pageX - $(this).offset().left;
    lastTouchX = x;
    var y = e.originalEvent.touches[0].pageY - $(this).offset().top;
    lastTouchY = y;
    dragClick(x, y);
  });
  _canvas
    .bind("touchstart", function(e) {
      e.preventDefault();
      document.activeElement.blur();
      var x = e.originalEvent.touches[0].pageX - $(this).offset().left;
      var y = e.originalEvent.touches[0].pageY - $(this).offset().top;
      startClick(x, y);
    })
    .bind("touchend", function(e) {
      e.preventDefault();
      document.activeElement.blur();
      endClick(lastTouchX, lastTouchY);
      lastTouchX = lastTouchY = -1;
    });

  drawClearCanvas();

  // Draws a clear canvas, with gridlines
  function drawClearCanvas() {
    _ctx.clearRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);
    if (HanziLookup.options.drawingGrid) {
      _ctx.setLineDash([1, 1]);
      _ctx.lineWidth = 0.5;
      _ctx.strokeStyle = "grey";
      _ctx.beginPath();
      _ctx.moveTo(0, 0);
      _ctx.lineTo(_ctx.canvas.width, 0);
      _ctx.lineTo(_ctx.canvas.width, _ctx.canvas.height);
      _ctx.lineTo(0, _ctx.canvas.height);
      _ctx.lineTo(0, 0);
      _ctx.stroke();
      _ctx.beginPath();
      _ctx.moveTo(0, 0);
      _ctx.lineTo(_ctx.canvas.width, _ctx.canvas.height);
      _ctx.stroke();
      _ctx.beginPath();
      _ctx.moveTo(_ctx.canvas.width, 0);
      _ctx.lineTo(0, _ctx.canvas.height);
      _ctx.stroke();
      _ctx.beginPath();
      _ctx.moveTo(_ctx.canvas.width / 2, 0);
      _ctx.lineTo(_ctx.canvas.width / 2, _ctx.canvas.height);
      _ctx.stroke();
      _ctx.beginPath();
      _ctx.moveTo(0, _ctx.canvas.height / 2);
      _ctx.lineTo(_ctx.canvas.width, _ctx.canvas.height / 2);
      _ctx.stroke();
    }
  }

  function startClick(x, y) {
    clicking = true;
    _currentStroke = [];
    lastPt = [x, y];
    _currentStroke.push(lastPt);
    _ctx.strokeStyle = HanziLookup.options.strokeColor;
    _ctx.setLineDash([]);
    _ctx.lineWidth = strokeWidth;
    _ctx.beginPath();
    _ctx.moveTo(x, y);
    tstamp = new Date();
  }

  function dragClick(x, y) {
    if (new Date().getTime() - tstamp < 50) return;
    tstamp = new Date();
    var pt = [x, y];
    if (pt[0] == lastPt[0] && pt[1] == lastPt[1]) return;
    _currentStroke.push(pt);
    lastPt = pt;
    _ctx.lineTo(x, y);
    _ctx.stroke();
  }

  function endClick(x, y) {
    clicking = false;
    if (x == -1) return;
    _ctx.lineTo(x, y);
    _ctx.stroke();
    _currentStroke.push([x, y]);
    _rawStrokes.push(_currentStroke);
    _currentStroke = [];
    // Tell the world a stroke has finished
    if (_strokeFinised) _strokeFinised();
  }

  // Redraws raw strokes on the canvas.
  function redrawInput() {
    // Draw strokes proper
    for (var i1 in _rawStrokes) {
      _ctx.strokeStyle = HanziLookup.options.strokeColor;
      _ctx.setLineDash([]);
      _ctx.lineWidth = strokeWidth;
      _ctx.beginPath();
      _ctx.moveTo(_rawStrokes[i1][0][0], _rawStrokes[i1][0][1]);
      var len = _rawStrokes[i1].length;
      for (var i2 = 0; i2 < len - 1; i2++) {
        _ctx.lineTo(_rawStrokes[i1][i2][0], _rawStrokes[i1][i2][1]);
        _ctx.stroke();
      }
      _ctx.lineTo(_rawStrokes[i1][len - 1][0], _rawStrokes[i1][len - 1][1]);
      _ctx.stroke();
    }

    // No additional info: quit here.
    if (!_overlay) return;

    // Bounding rectangle
    if (_showBoundary) {
      _ctx.strokeStyle = "blue";
      _ctx.setLineDash([1, 1]);
      _ctx.lineWidth = 0.5;
      _ctx.beginPath();
      _ctx.moveTo(_overlay.left, _overlay.top);
      _ctx.lineTo(_overlay.right, _overlay.top);
      _ctx.stroke();
      _ctx.lineTo(_overlay.right, _overlay.bottom);
      _ctx.stroke();
      _ctx.lineTo(_overlay.left, _overlay.bottom);
      _ctx.stroke();
      _ctx.lineTo(_overlay.left, _overlay.top);
      _ctx.stroke();
    }

    // Skeleton strokes
    if (_showSubstrokes) {
      for (var six = 0; six != _overlay.xStrokes.length; ++six) {
        var xstroke = _overlay.xStrokes[six];
        _ctx.strokeStyle = "red";
        _ctx.setLineDash([]);
        _ctx.lineWidth = 1;
        _ctx.beginPath();
        _ctx.moveTo(xstroke[0][0], xstroke[0][1]);
        _ctx.arc(xstroke[0][0], xstroke[0][1], 3, 0, 2 * Math.PI, true);
        _ctx.fillStyle = "red";
        _ctx.fill();
        for (var i = 1; i < xstroke.length; ++i) {
          _ctx.lineTo(xstroke[i][0], xstroke[i][1]);
          _ctx.stroke();
          _ctx.beginPath();
          _ctx.arc(xstroke[i][0], xstroke[i][1], 3, 0, 2 * Math.PI, true);
          _ctx.fillStyle = "red";
          _ctx.fill();
        }
      }
    }

    // Control character medians
    if (_showControlMedians && _overlay.yStrokes) {
      for (var six = 0; six != _overlay.yStrokes.length; ++six) {
        var ystroke = _overlay.yStrokes[six];
        _ctx.strokeStyle = "#e6cee6";
        _ctx.setLineDash([]);
        _ctx.lineWidth = strokeWidth;
        _ctx.beginPath();
        _ctx.moveTo(ystroke[0][0], ystroke[0][1]);
        for (var i = 1; i < ystroke.length; ++i) {
          _ctx.lineTo(ystroke[i][0], ystroke[i][1]);
          _ctx.stroke();
        }
      }
    }

    // Control character's skeleton strokes
    if (_overlay.zStrokes) {
      for (var six = 0; six != _overlay.zStrokes.length; ++six) {
        var xstroke = _overlay.zStrokes[six];
        _ctx.strokeStyle = "green";
        _ctx.setLineDash([]);
        _ctx.lineWidth = 1;
        _ctx.beginPath();
        _ctx.moveTo(xstroke[0][0], xstroke[0][1]);
        _ctx.arc(xstroke[0][0], xstroke[0][1], 3, 0, 2 * Math.PI, true);
        _ctx.fillStyle = "green";
        _ctx.fill();
        for (var i = 1; i < xstroke.length; ++i) {
          _ctx.lineTo(xstroke[i][0], xstroke[i][1]);
          _ctx.stroke();
          _ctx.beginPath();
          _ctx.arc(xstroke[i][0], xstroke[i][1], 3, 0, 2 * Math.PI, true);
          _ctx.fillStyle = "green";
          _ctx.fill();
        }
      }
    }
  }

  return {
    // Clear canvas and resets gathered strokes data for new input.
    clearCanvas: function() {
      _rawStrokes.length = 0;
      // Caller must make canvas redraw! And they will.
    },

    // Undoes the last stroke input by the user.
    undoStroke: function() {
      // Sanity check: nothing to do if input is empty (no strokes yet)
      if (_rawStrokes.length == 0) return;
      // Remove last stroke
      _rawStrokes.length = _rawStrokes.length - 1;
      // Caller must make canvas redraw! And they will.
    },

    // Clones the strokes accumulated so far. Three-dimensional array:
    // - array of strokes, each of which is
    // - array of points, each of which is
    // - two-dimensional array of coordinates
    cloneStrokes: function() {
      var res = [];
      for (var i = 0; i != _rawStrokes.length; ++i) {
        var stroke = [];
        for (var j = 0; j != _rawStrokes[i].length; ++j) {
          stroke.push([_rawStrokes[i][j][0], _rawStrokes[i][j][1]]);
        }
        res.push(stroke);
      }
      return res;
    },

    // Redraw canvas, e.g., after undo or clear
    redraw: function() {
      drawClearCanvas();
      redrawInput();
    },

    // Adds overlay to visualize analysis
    enrich: function(
      overlay,
      showSubstrokes,
      showBoundary,
      showControlMedians
    ) {
      _overlay = overlay;
      _showBoundary = showBoundary;
      _showSubstrokes = showSubstrokes;
      _showControlMedians = showControlMedians;
      drawClearCanvas();
      redrawInput();
    }
  };
};

HanziLookup.data = {};
HanziLookup.init = function(key, data) {
  if (!HanziLookup.data[key]) {
    HanziLookup.data[key] = data;
    HanziLookup.data[key].substrokes = HanziLookup.decodeCompact(
      data.substrokes
    );
  }
};

HanziLookup.MatchCollector = function(limit) {
  "use strict";

  var _count = 0;
  var _matches = [];

  for (var i = 0; i != limit; ++i) _matches.push(null);

  function findSlot(score) {
    var ix;
    for (ix = 0; ix < _count; ++ix) {
      if (_matches[ix].score < score) return ix;
    }
    return ix;
  }

  function removeExistingLower(match) {
    var ix = -1;
    for (var i = 0; i != _count; ++i) {
      if (_matches[i].character == match.character) {
        ix = i;
        break;
      }
    }
    // Not there yet: we're good, match doesn't need to be skipped
    if (ix == -1) return false;
    // New score is not better: skip this match
    if (match.score <= _matches[ix].score) return true;
    // Remove existing match; don't skip new. Means shifting array left.
    for (var i = ix; i < _matches.length - 1; ++i)
      _matches[i] = _matches[i + 1];
    --_count;
    return false;
  }

  function doFileMatch(match) {
    // Already at limit: don't bother if new match's score is smaller than current minimum
    if (
      _count == _matches.length &&
      match.score <= _matches[_matches.length - 1].score
    )
      return;
    // Remove if we already have this character with a lower score
    // If "true", we should skip new match (already there with higher score)
    if (removeExistingLower(match)) return;
    // Where does new match go? (Keep array sorted largest score to smallest.)
    var pos = findSlot(match.score);
    // Slide rest to the right
    for (var i = _matches.length - 1; i > pos; --i)
      _matches[i] = _matches[i - 1];
    // Replace at position
    _matches[pos] = match;
    // Increase count if we're just now filling up
    if (_count < _matches.length) ++_count;
  }

  function doGetMatches() {
    return _matches.slice(0, _count);
  }

  return {
    fileMatch: function(match) {
      doFileMatch(match);
    },
    getMatches: function() {
      return doGetMatches();
    }
  };
};

// Magic constants
HanziLookup.MAX_CHARACTER_STROKE_COUNT = 48;
HanziLookup.MAX_CHARACTER_SUB_STROKE_COUNT = 64;
HanziLookup.DEFAULT_LOOSENESS = 0.15;
HanziLookup.AVG_SUBSTROKE_LENGTH = 0.33; // an average length (out of 1)
HanziLookup.SKIP_PENALTY_MULTIPLIER = 1.75; // penalty mulitplier for skipping a stroke
HanziLookup.CORRECT_NUM_STROKES_BONUS = 0.1; // max multiplier bonus if characters has the correct number of strokes
HanziLookup.CORRECT_NUM_STROKES_CAP = 10; // characters with more strokes than this will not be multiplied

HanziLookup.Matcher = function(dataName, looseness) {
  "use strict";

  var _looseness = looseness || HanziLookup.DEFAULT_LOOSENESS;
  var _repo = HanziLookup.data[dataName].chars;
  var _sbin = HanziLookup.data[dataName].substrokes;
  var _scoreMatrix = buildScoreMatrix();
  var _charsChecked;
  var _subStrokesCompared;

  var DIRECTION_SCORE_TABLE;
  var LENGTH_SCORE_TABLE;
  var POS_SCORE_TABLE;

  // Init score tables
  initScoreTables();

  function doMatch(inputChar, limit, ready) {
    // Diagnostic counters
    _charsChecked = 0;
    _subStrokesCompared = 0;

    // This will gather matches
    var matchCollector = new HanziLookup.MatchCollector(limit);

    // Edge case: empty input should return no matches; but permissive lookup does find a few...
    if (inputChar.analyzedStrokes.length == 0)
      return matchCollector.getMatches();

    // Flat format: matching needs this. Only transform once.
    var inputSubStrokes = [];
    for (var i = 0; i != inputChar.analyzedStrokes.length; ++i) {
      var stroke = inputChar.analyzedStrokes[i];
      for (var j = 0; j != stroke.subStrokes.length; ++j) {
        inputSubStrokes.push(stroke.subStrokes[j]);
      }
    }

    // Some pre-computed looseness magic
    var strokeCount = inputChar.analyzedStrokes.length;
    var subStrokeCount = inputChar.subStrokeCount;
    // Get the range of strokes to compare against based on the loosness.
    // Characters with fewer strokes than strokeCount - strokeRange
    // or more than strokeCount + strokeRange won't even be considered.
    var strokeRange = getStrokesRange(strokeCount);
    var minimumStrokes = Math.max(strokeCount - strokeRange, 1);
    var maximumStrokes = Math.min(
      strokeCount + strokeRange,
      HanziLookup.MAX_CHARACTER_STROKE_COUNT
    );
    // Get the range of substrokes to compare against based on looseness.
    // When trying to match sub stroke patterns, won't compare sub strokes
    // that are farther about in sequence than this range.  This is to make
    // computing matches less expensive for low loosenesses.
    var subStrokesRange = getSubStrokesRange(subStrokeCount);
    var minSubStrokes = Math.max(subStrokeCount - subStrokesRange, 1);
    var maxSubStrokes = Math.min(
      subStrokeCount + subStrokesRange,
      HanziLookup.MAX_CHARACTER_SUB_STROKE_COUNT
    );
    // Iterate over all characters in repo
    for (var cix = 0; cix != _repo.length; ++cix) {
      var repoChar = _repo[cix];
      var cmpStrokeCount = repoChar[1];
      var cmpSubStrokes = repoChar[2];
      if (cmpStrokeCount < minimumStrokes || cmpStrokeCount > maximumStrokes)
        continue;
      if (
        cmpSubStrokes.length < minSubStrokes ||
        cmpSubStrokes.length > maxSubStrokes
      )
        continue;
      // Match against character in repo
      var match = matchOne(
        strokeCount,
        inputSubStrokes,
        subStrokesRange,
        repoChar
      );
      // File; collector takes care of comparisons and keeping N-best
      matchCollector.fileMatch(match);
    }
    // When done: just return collected matches
    // This is an array of CharacterMatch objects
    ready(matchCollector.getMatches());
  }

  function getStrokesRange(strokeCount) {
    if (_looseness == 0) return 0;
    if (_looseness == 1) return HanziLookup.MAX_CHARACTER_STROKE_COUNT;
    // We use a CubicCurve that grows slowly at first and then rapidly near the end to the maximum.
    // This is so a looseness at or near 1.0 will return a range that will consider all characters.
    var ctrl1X = 0.35;
    var ctrl1Y = strokeCount * 0.4;
    var ctrl2X = 0.6;
    var ctrl2Y = strokeCount;
    var curve = new HanziLookup.CubicCurve2D(
      0,
      0,
      ctrl1X,
      ctrl1Y,
      ctrl2X,
      ctrl2Y,
      1,
      HanziLookup.MAX_CHARACTER_STROKE_COUNT
    );
    var t = curve.getFirstSolutionForX(_looseness);
    // We get the t value on the parametrized curve where the x value matches the looseness.
    // Then we compute the y value for that t. This gives the range.
    return Math.round(curve.getYOnCurve(t));
  }

  function getSubStrokesRange(subStrokeCount) {
    // Return the maximum if looseness = 1.0.
    // Otherwise we'd have to ensure that the floating point value led to exactly the right int count.
    if (_looseness == 1.0) return HanziLookup.MAX_CHARACTER_SUB_STROKE_COUNT;
    // We use a CubicCurve that grows slowly at first and then rapidly near the end to the maximum.
    var y0 = subStrokeCount * 0.25;
    var ctrl1X = 0.4;
    var ctrl1Y = 1.5 * y0;
    var ctrl2X = 0.75;
    var ctrl2Y = 1.5 * ctrl1Y;
    var curve = new HanziLookup.CubicCurve2D(
      0,
      y0,
      ctrl1X,
      ctrl1Y,
      ctrl2X,
      ctrl2Y,
      1,
      HanziLookup.MAX_CHARACTER_SUB_STROKE_COUNT
    );
    var t = curve.getFirstSolutionForX(_looseness);
    // We get the t value on the parametrized curve where the x value matches the looseness.
    // Then we compute the y value for that t. This gives the range.
    return Math.round(curve.getYOnCurve(t));
  }

  function buildScoreMatrix() {
    // We use a dimension + 1 because the first row and column are seed values.
    var dim = HanziLookup.MAX_CHARACTER_SUB_STROKE_COUNT + 1;
    var res = [];
    for (var i = 0; i < dim; i++) {
      res.push([]);
      for (var j = 0; j < dim; j++) res[i].push(0);
    }
    // Seed the first row and column with base values.
    // Starting from a cell that isn't at 0,0 to skip strokes incurs a penalty.
    for (var i = 0; i < dim; i++) {
      var penalty =
        -HanziLookup.AVG_SUBSTROKE_LENGTH *
        HanziLookup.SKIP_PENALTY_MULTIPLIER *
        i;
      res[i][0] = penalty;
      res[0][i] = penalty;
    }
    return res;
  }

  function matchOne(
    inputStrokeCount,
    inputSubStrokes,
    subStrokesRange,
    repoChar
  ) {
    // Diagnostic counter
    ++_charsChecked;

    // Calculate score. This is the *actual* meat.
    var score = computeMatchScore(
      inputStrokeCount,
      inputSubStrokes,
      subStrokesRange,
      repoChar
    );
    // If the input character and the character in the repository have the same number of strokes, assign a small bonus.
    // Might be able to remove this, doesn't really add much, only semi-useful for characters with only a couple strokes.
    if (
      inputStrokeCount == repoChar[1] &&
      inputStrokeCount < HanziLookup.CORRECT_NUM_STROKES_CAP
    ) {
      // The bonus declines linearly as the number of strokes increases, writing 2 instead of 3 strokes is worse than 9 for 10.
      var bonus =
        (HanziLookup.CORRECT_NUM_STROKES_BONUS *
          Math.max(HanziLookup.CORRECT_NUM_STROKES_CAP - inputStrokeCount, 0)) /
        HanziLookup.CORRECT_NUM_STROKES_CAP;
      score += bonus * score;
    }
    return new HanziLookup.CharacterMatch(repoChar[0], score);
  }

  function computeMatchScore(
    strokeCount,
    inputSubStrokes,
    subStrokesRange,
    repoChar
  ) {
    for (var x = 0; x < inputSubStrokes.length; x++) {
      // For each of the input substrokes...
      var inputDirection = inputSubStrokes[x].direction;
      var inputLength = inputSubStrokes[x].length;
      var inputCenter = [
        inputSubStrokes[x].centerX,
        inputSubStrokes[x].centerY
      ];
      for (var y = 0; y < repoChar[2]; y++) {
        // For each of the compare substrokes...
        // initialize the score as being not usable, it will only be set to a good
        // value if the two substrokes are within the range.
        var newScore = Number.NEGATIVE_INFINITY;
        if (Math.abs(x - y) <= subStrokesRange) {
          // The range is based on looseness.  If the two substrokes fall out of the range
          // then the comparison score for those two substrokes remains Double.MIN_VALUE and will not be used.
          var compareDirection = _sbin[repoChar[3] + y * 3]; // repoChar[2][y][0];
          var compareLength = _sbin[repoChar[3] + y * 3 + 1]; // repoChar[2][y][1];
          var compareCenter = null;
          var bCenter = _sbin[repoChar[3] + y * 3 + 2];
          if (bCenter > 0)
            compareCenter = [(bCenter & 0xf0) >>> 4, bCenter & 0x0f];
          // We incur penalties for skipping substrokes.
          // Get the scores that would be incurred either for skipping the substroke from the descriptor, or from the repository.
          var skip1Score =
            _scoreMatrix[x][y + 1] -
            (inputLength / 256) * HanziLookup.SKIP_PENALTY_MULTIPLIER;
          var skip2Score =
            _scoreMatrix[x + 1][y] -
            (compareLength / 256) * HanziLookup.SKIP_PENALTY_MULTIPLIER;
          // The skip score is the maximum of the scores that would result from skipping one of the substrokes.
          var skipScore = Math.max(skip1Score, skip2Score);
          // The matchScore is the score of actually comparing the two substrokes.
          var matchScore = computeSubStrokeScore(
            inputDirection,
            inputLength,
            compareDirection,
            compareLength,
            inputCenter,
            compareCenter
          );
          // Previous score is the score we'd add to if we compared the two substrokes.
          var previousScore = _scoreMatrix[x][y];
          // Result score is the maximum of skipping a substroke, or comparing the two.
          newScore = Math.max(previousScore + matchScore, skipScore);
        }
        // Set the score for comparing the two substrokes.
        _scoreMatrix[x + 1][y + 1] = newScore;
      }
    }
    // At the end the score is the score at the opposite corner of the matrix...
    // don't need to use count - 1 since seed values occupy indices 0
    return _scoreMatrix[inputSubStrokes.length][repoChar[2]];
  }

  function computeSubStrokeScore(
    inputDir,
    inputLen,
    repoDir,
    repoLen,
    inputCenter,
    repoCenter
  ) {
    // Diagnostic counter
    ++_subStrokesCompared;

    // Score drops off after directions get sufficiently apart, start to rise again as the substrokes approach opposite directions.
    // This in particular reflects that occasionally strokes will be written backwards, this isn't totally bad, they get
    // some score for having the stroke oriented correctly.
    var directionScore = getDirectionScore(inputDir, repoDir, inputLen);
    //var directionScore = Math.max(Math.cos(2.0 * theta), 0.3 * Math.cos((1.5 * theta) + (Math.PI / 3.0)));

    // Length score gives an indication of how similar the lengths of the substrokes are.
    // Get the ratio of the smaller of the lengths over the longer of the lengths.
    var lengthScore = getLengthScore(inputLen, repoLen);
    // Ratios that are within a certain range are fine, but after that they drop off, scores not more than 1.
    //var lengthScore = Math.log(lengthScore + (1.0 / Math.E)) + 1;
    //lengthScore = Math.min(lengthScore, 1.0);

    // For the final "classic" score we just multiply the two scores together.
    var score = lengthScore * directionScore;

    // If we have center points (from MMAH data), reduce score if strokes are farther apart
    if (repoCenter) {
      var dx = inputCenter[0] - repoCenter[0];
      var dy = inputCenter[1] - repoCenter[1];
      var closeness = POS_SCORE_TABLE[dx * dx + dy * dy];

      // var dist = Math.sqrt(dx * dx + dy * dy);
      // // Distance is [0 .. 21.21] because X and Y are all [0..15]
      // // Square distance is [0..450]
      // // TO-DO: a cubic function for this too
      // var closeness = 1 - dist / 22;
      // Closeness is always [0..1]. We reduce positive score, and make negative more negative.
      if (score > 0) score *= closeness;
      else score /= closeness;
    }
    return score;
  }

  function initScoreTables() {
    // Builds a precomputed array of values to use when getting the score between two substroke directions.
    // Two directions should differ by 0 - Pi, and the score should be the (difference / Pi) * score table's length
    // The curve drops as the difference grows, but rises again some at the end because
    // a stroke that is 180 degrees from the expected direction maybe OK passable.
    var dirCurve = new HanziLookup.CubicCurve2D(
      0,
      1.0,
      0.5,
      1.0,
      0.25,
      -2.0,
      1.0,
      1.0
    );
    DIRECTION_SCORE_TABLE = initCubicCurveScoreTable(dirCurve, 256);

    // Builds a precomputed array of values to use when getting the score between two substroke lengths.
    // A ratio less than one is computed for the two lengths, and the score should be the ratio * score table's length.
    // Curve grows rapidly as the ratio grows and levels off quickly.
    // This is because we don't really expect lengths to vary a lot.
    // We are really just trying to distinguish between tiny strokes and long strokes.
    var lenCurve = new HanziLookup.CubicCurve2D(
      0,
      0,
      0.25,
      1.0,
      0.75,
      1.0,
      1.0,
      1.0
    );
    LENGTH_SCORE_TABLE = initCubicCurveScoreTable(lenCurve, 129);

    POS_SCORE_TABLE = [];
    for (var i = 0; i <= 450; ++i) {
      POS_SCORE_TABLE.push(1 - Math.sqrt(i) / 22);
    }
  }

  function initCubicCurveScoreTable(curve, numSamples) {
    var x1 = curve.x1();
    var x2 = curve.x2();
    var range = x2 - x1;
    var x = x1;
    var xInc = range / numSamples; // even incrementer to increment x value by when sampling across the curve
    var scoreTable = [];
    // Sample evenly across the curve and set the samples into the table.
    for (var i = 0; i < numSamples; i++) {
      var t = curve.getFirstSolutionForX(Math.min(x, x2));
      scoreTable.push(curve.getYOnCurve(t));
      x += xInc;
    }
    return scoreTable;
  }

  function getDirectionScore(direction1, direction2, inputLength) {
    // Both directions are [0..255], integer
    var theta = Math.abs(direction1 - direction2);
    // Lookup table for actual score function
    var directionScore = DIRECTION_SCORE_TABLE[theta];
    // Add bonus if the input length is small.
    // Directions doesn't really matter for small dian-like strokes.
    if (inputLength < 64) {
      var shortLengthBonusMax = Math.min(1.0, 1.0 - directionScore);
      var shortLengthBonus = shortLengthBonusMax * (1 - inputLength / 64);
      directionScore += shortLengthBonus;
    }
    return directionScore;
  }

  function getLengthScore(length1, length2) {
    // Get the ratio between the two lengths less than one.
    var ratio;
    // Shift for "times 128"
    if (length1 > length2) ratio = Math.round((length2 << 7) / length1);
    else ratio = Math.round((length1 << 7) / length2);
    // Lookup table for actual score function
    return LENGTH_SCORE_TABLE[ratio];
  }

  return {
    match: function(analyzedChar, limit, ready) {
      doMatch(analyzedChar, limit, ready);
    },

    getCounters: function() {
      return {
        chars: _charsChecked,
        subStrokes: _subStrokesCompared
      };
    }
  };
};

HanziLookup.StrokeInputOverlay = function(
  top,
  right,
  bottom,
  left,
  xStrokes,
  yStrokes,
  zStrokes
) {
  "use strict";

  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left;
  this.xStrokes = xStrokes;
  this.yStrokes = yStrokes;
  this.zStrokes = zStrokes;
};

HanziLookup.SubStroke = function(direction, length, centerX, centerY) {
  "use strict";

  this.direction = direction;
  this.length = length;
  this.centerX = centerX;
  this.centerY = centerY;
};

exports = module.exports = HanziLookup;
