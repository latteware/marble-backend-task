/* global describe, expect, it */
const Task = require('../../index')

describe('Proxy mode', function () {
  // Proxy: execute the function and records it
  it('Should execute the boundary', async function () {
    const add = new Task(async (argv, { fetchIncrement }) => {
      const increment = await fetchIncrement(argv)

      return argv.value + increment
    }, {
      boundaries: {
        fetchIncrement: async (argv) => {
          return argv.value
        }
      },
      mode: 'proxy'
    })

    const { fetchIncrement } = add.getBoundaries()
    const result = await add.run({ value: 5 })

    expect(result).to.equal(10)
    expect(fetchIncrement.getMode()).to.equal('proxy')
  })
})

describe('Proxy pass mode', function () {
  // Proxy pass: review if the input exist, it it exist returns the previous value and if not execute the functions
  it('Should return value from record', async function () {
    let i = 0
    const add = new Task(async (argv, { fetchIncrement }) => {
      const increment = await fetchIncrement(argv)

      return argv.value + increment
    }, {
      boundaries: {
        fetchIncrement: async (argv) => {
          i++
          return argv.value
        }
      },
      boundariesTape: {
        fetchIncrement: [
          { input: [{ value: 5 }], output: 5 }
        ]
      },
      mode: 'proxy-pass'
    })

    const { fetchIncrement } = add.getBoundaries()
    const result = await add.run({ value: 5 })

    expect(fetchIncrement.getMode()).to.equal('proxy-pass')
    expect(result).to.equal(10)
    expect(i).to.equal(0)
  })

  it('Should run boundary', async function () {
    let i = 0
    const add = new Task(async (argv, { fetchIncrement }) => {
      const increment = await fetchIncrement(argv)

      return argv.value + increment
    }, {
      boundaries: {
        fetchIncrement: async (argv) => {
          i++
          return argv.value
        }
      },
      boundariesTape: {
        fetchIncrement: [
          { input: [{ value: 6 }], output: 5 }
        ]
      },
      mode: 'proxy-pass'
    })

    const { fetchIncrement } = add.getBoundaries()
    const result = await add.run({ value: 5 })

    expect(fetchIncrement.getMode()).to.equal('proxy-pass')
    expect(result).to.equal(10)
    expect(i).to.equal(1)
  })
})

describe('Proxy pass mode', function () {
  // Proxy-catch: executes the function and if it throws and error, it tries to use a previews output if it exists for the input.
  it('Should run boundary', async function () {
    let i = 0
    const add = new Task(async (argv, { fetchIncrement }) => {
      const increment = await fetchIncrement(argv)

      return argv.value + increment
    }, {
      boundaries: {
        fetchIncrement: async (argv) => {
          i++
          return argv.value
        }
      },
      boundariesTape: {
        fetchIncrement: [
          { input: [{ value: 5 }], output: 5 }
        ]
      },
      mode: 'proxy-catch'
    })

    const { fetchIncrement } = add.getBoundaries()
    const result = await add.run({ value: 5 })

    expect(fetchIncrement.getMode()).to.equal('proxy-catch')
    expect(result).to.equal(10)
    expect(i).to.equal(1)
  })

  it('After boundary fails, should return value from record', async function () {
    let i = 0
    const add = new Task(async (argv, { fetchIncrement }) => {
      const increment = await fetchIncrement(argv)

      return argv.value + increment
    }, {
      boundaries: {
        fetchIncrement: async (argv) => {
          i++
          throw new Error('Something')
        }
      },
      boundariesTape: {
        fetchIncrement: [
          { input: [{ value: 5 }], output: 5 }
        ]
      },
      mode: 'proxy-catch'
    })

    const { fetchIncrement } = add.getBoundaries()
    const result = await add.run({ value: 5 })

    expect(fetchIncrement.getMode()).to.equal('proxy-catch')
    expect(result).to.equal(10)
    expect(i).to.equal(1)
  })
})

describe('Replay mode', function () {
  // Replay: review if the input exist and if it doesnt throws and error.
  it('Should return value from record', async function () {
    let i = 0
    const add = new Task(async (argv, { fetchIncrement }) => {
      const increment = await fetchIncrement(argv)

      return argv.value + increment
    }, {
      boundaries: {
        fetchIncrement: async (argv) => {
          i++
          return argv.value
        }
      },
      boundariesTape: {
        fetchIncrement: [
          { input: [{ value: 5 }], output: 5 }
        ]
      },
      mode: 'replay'
    })

    const { fetchIncrement } = add.getBoundaries()
    const result = await add.run({ value: 5 })

    expect(fetchIncrement.getMode()).to.equal('replay')
    expect(result).to.equal(10)
    expect(i).to.equal(0)
  })

  it('Should fail if the input its not present', async function () {
    let i = 0
    const add = new Task(async (argv, { fetchIncrement }) => {
      const increment = await fetchIncrement(argv)

      return argv.value + increment
    }, {
      boundaries: {
        fetchIncrement: async (argv) => {
          i++
          return argv.value
        }
      },
      mode: 'replay'
    })

    const { fetchIncrement } = add.getBoundaries()

    let err
    try {
      await add.run({ value: 5 })
    } catch (e) {
      err = e
    }

    expect(fetchIncrement.getMode()).to.equal('replay')
    expect(err.message).to.equal('No tape value for this inputs')
    expect(i).to.equal(0)
  })
})
