const parseArgs = require('minimist')
const co = require('co')
const lov = require('lov')

const Task = class Task {
  constructor (fn, timeout = 10) {
    this._fn = fn
    this._schema = null
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

  run (argv) {
    const wrap = co.wrap(this._fn)
    argv = argv || parseArgs(process.argv.slice(2))

    const isValid = this.validate(argv)

    if (isValid.error) {
      throw isValid.error
    }

    let q
    if (argv.asBackground) {
      q = this.runAsBackgroundJob(argv)
    } else {
      q = wrap(argv)
    }

    if (this._cli) {
      q.then(data => {
        console.log('Success =>', data)

        setTimeout(() => process.exit(), this._timeout)
      }).catch(err => {
        console.error('=>', err)
        process.nextTick(() => process.exit(1))
      })
    }

    return q
  }
}

module.exports = Task
