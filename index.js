const parseArgs = require('minimist')
const lov = require('lov')

const Boundary = require('./utils/boundary')

const Task = class Task {
  constructor (fn, conf = {}) {
    this._fn = fn
    // review how to add it in the same from on API and task
    this._schema = conf.validate || null

    this._boundariesDefinition = conf.boundaries || {}
    this._boundariesTape = conf.boundariesTape || {}
    this._boundaries = this._createBounderies(this._boundariesDefinition, this._boundariesTape)
    this._listener = null

    // Recorder hooks
    this._recordTo = conf.recordTo || null
    if (this._recordTo) {
      // ToDo: Change to so this block is part of the RecordTape
      // this._listener = this._recordTo.getRecorder()
      this._listener = async (logItem, boundaries) => {
        const tape = this._recordTo

        tape.addLogItem(logItem)
        // ToDo:
        // - Create a way to update boundaries atomicaly if the input already exist
        tape.addBoundariesData(boundaries)

        // Move to async update
        // Add a way to only update on replay
        tape.saveSync()
      }

      // Set up initial bonderies
      this._boundaries = this._createBounderies(this._boundariesDefinition, this._recordTo.getBoundaries(), this._recordTo.getMode())
    }

    // Cool down time before killing the process on cli runner
    this._coolDown = 1000
  }

  setCliHandlers () {
    this._cli = true
  }

  setSchema (schema) {
    this._schema = schema
  }

  getSchema () {
    return this._schema
  }

  validate (argv) {
    if (!this._schema) {
      return {}
    }

    return lov.validate(argv, this._schema)
  }

  addListener (fn) {
    this._listener = fn
  }

  removeRecorder () {
    this._listener = null
  }

  getTape () {
    return this._recordTo
  }

  getBoundaries () {
    return this._boundaries
  }

  _createBounderies (boundaries, tapes, mode = 'proxy') {
    const boundariesFns = {}

    for (const name in boundaries) {
      const boundary = new Boundary(boundaries[name])

      if (tapes && tapes[name]) {
        const tape = tapes[name]

        boundary.setMode(mode)
        boundary.loadTape(tape)
      }

      boundariesFns[name] = boundary
    }

    return boundariesFns
  }

  _getBondaryTape (boundaries) {
    const boundariesTape = {}

    for (const name in boundaries) {
      const boundary = boundaries[name]

      boundariesTape[name] = boundary.getTape()
    }

    return boundariesTape
  }

  run (argv) {
    // ToDo: have a better CLI handler, probably move of the task runner
    const cliArgs = parseArgs(process.argv.slice(2))
    delete cliArgs._
    argv = argv || cliArgs
    // End ToDo block

    const boundaries = this._boundaries

    const q = new Promise((resolve, reject) => {
      const isValid = this.validate(argv)

      if (isValid.error) {
        if (this._listener) {
          this._listener({ input: argv, error: isValid.error }, this._getBondaryTape(boundaries))
        }

        throw isValid.error
      }

      (async () => {
        let output, e
        try {
          output = await this._fn(argv, boundaries)
        } catch (error) {
          if (this._listener) {
            this._listener({ input: argv, error }, this._getBondaryTape(boundaries))
          }
          e = error
          reject(error)
        }

        if (!e) {
          if (this._listener) {
            this._listener({ input: argv, output }, this._getBondaryTape(boundaries))
          }
          resolve(output)
        }
      })()
    })

    if (this._cli) {
      q.then(output => {
        console.log('Success =>', output)
        setTimeout(() => process.exit(), this._coolDown)
      }).catch(error => {
        console.error('=>', error)
        process.nextTick(() => process.exit(1))
      })
    }

    return q
  }
}

module.exports = Task
