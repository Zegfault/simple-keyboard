class CubicCurve2D {
  constructor (x1, y1, ctrlx1, ctrly1, ctrlx2, ctrly2, x2, y2) {
    this._x1 = x1
    this._y1 = y1
    this._ctrlX1 = ctrlx1
    this._ctrlY1 = ctrly1
    this._ctrlX2 = ctrlx2
    this._ctrlY2 = ctrly2
    this._x2 = x2
    this._y2 = y2
  }

  x1 () {
    return this._x1
  }

  x2 () {
    return this._x2
  }

  _getCubicAx () {
    return this._x2 - this._x1 - this._getCubicBx() - this._getCubicCx()
  }
  _getCubicAy () {
    return this._y2 - this._y1 - this._getCubicBy() - this._getCubicCy()
  }
  _getCubicBx () {
    return 3.0 * (this._ctrlX2 - this._ctrlX1) - this._getCubicCx()
  }
  _getCubicBy () {
    return 3.0 * (this._ctrlY2 - this._ctrlY1) - this._getCubicCy()
  }
  _getCubicCx () {
    return 3.0 * (this._ctrlX1 - this._x1)
  }
  _getCubicCy () {
    return 3.0 * (this._ctrlY1 - this._y1)
  }

  _doSolveForX (x) {
    let a = this._getCubicAx()
    let b = this._getCubicBx()
    let c = this._getCubicCx()
    let d = this._x1 - x
    let f = ((3.0 * c) / a - (b * b) / (a * a)) / 3.0
    let g = ((2.0 * b * b * b) / (a * a * a) - (9.0 * b * c) / (a * a) + (27.0 * d) / a) / 27.0
    let h = (g * g) / 4.0 + (f * f * f) / 27.0
    if (h > 0) {
      let u = 0 - g
      let r = u / 2 + Math.pow(h, 0.5)
      let s6 = Math.pow(r, 1/3)
      let s8 = s6
      let t8 = u / 2 - Math.pow(h, 0.5)
      let v7 = Math.pow(0 - t8, 1/3)
      let v8 = v7
      let x3 = s8 - v8 - b / (3 * a)
      return [x3]
    } else if (f == 0.0 && g == 0.0 && h == 0.0) {
      return [-Math.pow(d / a, 1.0 / 3.0)]
    }
    let i = Math.sqrt((g * g) / 4.0 - h)
    let j = Math.pow(i, 1.0 / 3.0)
    let k = Math.acos(-g / (2 * i))
    let l = j * -1.0
    let m = Math.cos(k / 3.0)
    let n = Math.sqrt(3.0) * Math.sin(k / 3.0)
    let p = (b / (3.0 * a)) * -1.0
    return [
      2.0 * j * Math.cos(k / 3.0) - b / (3.0 * a),
      l * (m + n) + p,
      l * (m - n) + p
    ]
  }

  getYOnCurve (t) {
    const ay = this._getCubicAy()
    const by = this._getCubicBy()
    const cy = this._getCubicCy()
    const tSquared = t * t
    const tCubed = t * tSquared
    return ay * tCubed + by * tSquared + cy * t + this._y1
  }

  solveForX (x) {
    return this._doSolveForX(x)
  }

  getFirstSolutionForX (x) {
    const solutions = this._doSolveForX(x)
    for (let i = 0; i != solutions.length; ++i) {
      const d = solutions[i]
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
}
export default CubicCurve2D
