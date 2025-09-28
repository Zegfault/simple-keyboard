class MatchCollector {
  constructor (limit) {
    this._count = 0
    this._matches = []
    for (let i = 0; i != limit; ++i) {
      this._matches.push(null)
    }
  }

  _findSlot (score) {
    let ix
    for (ix = 0; ix < this._count; ++ix) {
      if (this._matches[ix].score < score) {
        return ix
      }
    }
    return ix
  }

  _removeExistingLower (match) {
    let ix = -1
    for (let i = 0; i != this._count; ++i) {
      if (this._matches[i].character == match.character) {
        ix = i
        break
      }
    }
    if (ix == -1) {
      return false
    }
    if (match.score <= this._matches[ix].score) {
      return true
    }
    for (let i = ix; i < this._matches.length - 1; ++i) {
      this._matches[i] = this._matches[i + 1]
    }
    --this._count
    return false
  }

  fileMatch (match) {
    if ((this._count == this._matches.length && match.score <= this._matches[this._matches.length - 1].score) || this._removeExistingLower(match)) {
      return
    }
    let pos = this._findSlot(match.score)
    for (let i = this._matches.length - 1; i > pos; --i) {
      this._matches[i] = this._matches[i - 1]
    }
    this._matches[pos] = match
    if (this._count < this._matches.length) {
      ++this._count
    }
  }

  getMatches () {
    return this._matches.slice(0, this._count)
  }
}
export default MatchCollector
