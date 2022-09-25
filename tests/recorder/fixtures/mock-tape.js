const MockTape = class {
  constructor (mockTape) {
    this._log = mockTape.log
    this._boundaries = mockTape.boundaries
  }

  getLog () {
    return this._log
  }

  getMode () {
    return 'proxy'
  }

  getBoundaries () {
    return this._boundaries
  }

  addLogItem (item) {
    if (this._mode === 'replay') {
      return
    }

    if (
      (item.input && item.output) ||
      (item.input && item.error)
    ) {
      return this._log.push(item)
    }
  }

  addBoundariesData (boundaries) {
    this._boundaries = boundaries
  }

  recordFrom (task) {
    task.addListener(async (logItem, boundaries) => {
      const tape = this

      tape.addLogItem(logItem)
      tape.addBoundariesData(boundaries)
    })

    task.setBoundariesTapes(this._boundaries)
  }
}

module.exports = MockTape
