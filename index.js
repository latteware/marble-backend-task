const parseArgs = require('minimist')
const lov = require('lov')

const Boundary = require('./utils/boundary')

const Task = class Task {
  constructor (fn, conf = {}) {
    this._fn = fn
    this._schema = null
    this._recorder = null

    this._boundaries = conf.boundaries || {}
    this._boundariesTape = conf.boundariesTape || {}
    this._timeout = conf._timeout
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

  addRecorder (fn) {
    this._recorder = fn
  }

  removeRecorder () {
    this._recorder = null
  }

  _createBounderies (boundaries, tape) {
    const boundariesFns = {}

    for (const name in boundaries) {
      const boundary = new Boundary(this._boundaries[name])

      if (this._boundariesTape[name]) {
        boundary.setMode('replay')
        boundary.loadTape(this._boundariesTape[name])
      }

      boundariesFns[name] = boundary
    }

    return boundariesFns
  }

  run (argv) {
    argv = argv || parseArgs(process.argv.slice(2))
    const boundaries = this._createBounderies(this._boundaries, this._boundariesTape)

    const q = new Promise((resolve, reject) => {
      const isValid = this.validate(argv)

      if (isValid.error) {
        if (this._recorder) {
          this._recorder({ input: argv, error: isValid.error })
        }

        throw isValid.error
      }

      (async () => {
        let output, e
        try {
          output = await this._fn(argv, boundaries)
        } catch (error) {
          if (this._recorder) {
            this._recorder({ input: argv, error })
          }
          e = error
          reject(error)
        }

        if (!e) {
          if (this._recorder) {
            this._recorder({ input: argv, output })
          }
          resolve(output)
        }
      })()
    })

    if (this._cli) {
      q.then(output => {
        console.log('Success =>', output)
        setTimeout(() => process.exit(), this._timeout)
      }).catch(error => {
        console.error('=>', error)
        process.nextTick(() => process.exit(1))
      })
    }

    return q
  }
}

module.exports = Task
