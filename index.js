const parseArgs = require('minimist')

const Schema = require('@marble-seeds/schema')

const Boundary = require('./utils/boundary')

const Task = class Task {
  constructor (fn, conf = {}) {
    this._fn = fn
    // review how to add it in the same from on API and task
    this._schema = null
    if (conf.validate) {
      this._schema = new Schema(conf.validate)
    }

    this._mode = conf.mode || 'proxy'

    this._boundariesDefinition = conf.boundaries || {}
    this._boundariesTape = conf.boundariesTape || {}
    this._boundaries = this._createBounderies({
      definition: this._boundariesDefinition,
      baseData: this._boundariesTape,
      mode: this._mode
    })
    this._listener = null

    // Cool down time before killing the process on cli runner
    this._coolDown = 1000
  }

  getMode () {
    return this._mode
  }

  setMode (mode) {
    for (const name in this._boundaries) {
      const boundary = this._boundaries[name]

      boundary.setMode(mode)
    }

    this._mode = mode
  }

  setCliHandlers () {
    this._cli = true
  }

  setSchema (base) {
    this._schema = new Schema(base)
  }

  getSchema () {
    return this._schema
  }

  validate (argv) {
    if (!this._schema) {
      return null
    }

    return this._schema.validate(argv)
  }

  // Listen and emit to make it easy to have hooks
  // Posible improvement to handle multiple listeners, but so far its not needed
  addListener (fn) {
    this._listener = fn
  }

  removeListener () {
    this._listener = null
  }

  /*
    The listener get the input/outout of the call
    Plus all the boundary data
  */
  emit (event, data) {
    if (this._listener) {
      this._listener(
        data,
        this._getBondaryTape(this._boundaries)
      )
    }
  }

  getBoundaries () {
    return this._boundaries
  }

  setBoundariesTapes (boundariesTape) {
    for (const name in this._boundaries) {
      const boundary = this._boundaries[name]
      const tape = boundariesTape && boundariesTape[name]

      if (boundary && tape) {
        boundary.setTape(tape)
      }
    }
  }

  _createBounderies ({
    definition,
    baseData,
    mode = 'proxy'
  }) {
    const boundariesFns = {}

    for (const name in definition) {
      const boundary = new Boundary(definition[name])

      if (baseData && baseData[name]) {
        const tape = baseData[name]

        boundary.setTape(tape)
      }
      boundary.setMode(mode)

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
      const error = this.validate(argv)

      if (error) {
        this.emit('run', {
          input: argv,
          error: error.message
        })

        throw error
      }

      (async () => {
        let output, e
        try {
          output = await this._fn(argv, boundaries)
        } catch (error) {
          this.emit('run', {
            input: argv,
            error: error.message
          })
          e = error
          reject(error)
        }

        if (!e) {
          this.emit('run', {
            input: argv,
            output
          })

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
