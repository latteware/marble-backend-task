const parseArgs = require('minimist')
const lov = require('lov')

const Task = class Task {
  constructor (fn, timeout = 10) {
    this._fn = fn
    this._schema = null
    this._recorder = null

    // TODO: legacy implementation from marble seeds, change for a option object
    this._timeout = timeout
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

  run (argv) {
    argv = argv || parseArgs(process.argv.slice(2))

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
          output = this._fn(argv)
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
