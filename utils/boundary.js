const assert = require('assert')

const Boundary = function (fn) {
  let tape = []
  let mode = 'proxy'

  const findRecord = (record) => {
    return tape.find(item => {
      let error
      try {
        assert.deepEqual(record, item.input)
      } catch (e) {
        error = e
      }

      return !error
    })
  }

  const action = async function () {
    const argv = [...arguments] // convert to array
    const record = {
      input: argv
    }

    if (mode === 'proxy-pass') {
      const record = findRecord(argv)

      if (record) {
        return await (async () => {
          return record.output
        })()
      }
    }

    if (mode === 'replay') {
      return await (async () => {
        const record = tape.find(item => {
          let error
          try {
            assert.deepEqual(argv, item.input)
          } catch (e) {
            error = e
          }

          return !error
        })

        if (!record) {
          throw new Error('No tape value for this inputs')
        }

        if (record.error) {
          throw new Error(record.error)
        }

        return record.output
      })()
    }

    return await (async () => {
      let result, error
      try {
        result = await fn(...argv)
      } catch (e) {
        error = e
      }

      if (error) {
        const prevRecord = findRecord(argv)
        if (mode === 'proxy-catch' && prevRecord) {
          return await (async () => {
            return prevRecord.output
          })()
        } else {
          record.error = error.message
          tape.push(record)

          throw error
        }
      } else {
        record.output = result
        tape.push(record)

        return result
      }
    })()
  }

  action.getTape = function () {
    return tape
  }

  action.loadTape = function (newTape) {
    tape = newTape
  }

  action.getMode = function (newMode) {
    return mode
  }

  action.setMode = function (newMode) {
    mode = newMode
  }

  return action
}

module.exports = Boundary
