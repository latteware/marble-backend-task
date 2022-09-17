/* global describe, expect, it */
const Task = require('../../index')

describe('Listener with boundaries tests', function () {
  it('Should be record one item and its boundaries tape', async function () {
    const tape = []
    let boundariesTape = {}

    const task = new Task(async (argv, boundaries) => {
      const externalData = await boundaries.fetchExternalData()

      return { ...externalData, ...argv }
    }, {
      boundaries: {
        fetchExternalData: async () => {
          return { foo: false }
        }
      }
    })

    task.addListener((record, newBoundariesTape) => {
      tape.push(record)
      boundariesTape = newBoundariesTape
    })

    await task.run({ value: 5 })

    expect(tape.length).to.equal(1)
    expect(tape[0].input).to.deep.equal({ value: 5 })
    expect(tape[0].output).to.deep.equal({ value: 5, foo: false })
    expect(boundariesTape).to.deep.equal({
      fetchExternalData: [
        { input: [], output: { foo: false } }
      ]
    })
  })

  it('Should be record multiple item and its boundaries tape', async function () {
    const tape = []
    let boundariesTape = {}

    const task = new Task(async (argv, boundaries) => {
      const externalData = await boundaries.fetchExternalData()

      return { ...externalData, ...argv }
    }, {
      boundaries: {
        fetchExternalData: async () => {
          return { foo: false }
        }
      }
    })

    task.addListener((record, newBoundariesTape) => {
      tape.push(record)

      boundariesTape = newBoundariesTape
    })

    await task.run({ value: 5 })
    await task.run({ value: 6 })

    expect(tape.length).to.equal(2)
    expect(tape[0].input).to.deep.equal({ value: 5 })
    expect(tape[0].output).to.deep.equal({ value: 5, foo: false })
    expect(tape[1].input).to.deep.equal({ value: 6 })
    expect(tape[1].output).to.deep.equal({ value: 6, foo: false })

    expect(boundariesTape).to.deep.equal({
      fetchExternalData: [
        { input: [], output: { foo: false } },
        { input: [], output: { foo: false } }
      ]
    })
  })

  it('Should be record error and its boundaries tape', async function () {
    const tape = []
    let boundariesTape = {}

    const task = new Task(async (argv, boundaries) => {
      const externalData = await boundaries.fetchExternalData()
      if (!argv.value) {
        throw new Error('Value is required')
      }

      return { ...externalData, ...argv }
    }, {
      boundaries: {
        fetchExternalData: async () => {
          return { foo: false }
        }
      }
    })

    task.addListener((record, newBoundariesTape) => {
      tape.push(record)
      boundariesTape = newBoundariesTape
    })

    try {
      await task.run({})
    } catch (e) {}

    expect(tape.length).to.equal(1)
    expect(tape[0].input).to.deep.equal({})
    expect(tape[0].error).to.deep.equal('Value is required')
    expect(boundariesTape).to.deep.equal({
      fetchExternalData: [
        { input: [], output: { foo: false } }
      ]
    })
  })

  it('Should be record error + success and its boundaries tape', async function () {
    const tape = []
    let boundariesTape = {}

    const task = new Task(async (argv, boundaries) => {
      const externalData = await boundaries.fetchExternalData()
      if (!argv.value) {
        throw new Error('Value is required')
      }

      return { ...externalData, ...argv }
    }, {
      boundaries: {
        fetchExternalData: async () => {
          return { foo: false }
        }
      }
    })

    task.addListener((record, newBoundariesTape) => {
      tape.push(record)
      boundariesTape = newBoundariesTape
    })

    try {
      await task.run({})
    } catch (e) {}
    await task.run({ value: 5 })

    expect(tape.length).to.equal(2)
    expect(tape[0].input).to.deep.equal({})
    expect(tape[0].error).to.deep.equal('Value is required')

    expect(tape[1].input).to.deep.equal({ value: 5 })
    expect(tape[1].output).to.deep.equal({ value: 5, foo: false })

    expect(boundariesTape).to.deep.equal({
      fetchExternalData: [
        { input: [], output: { foo: false } },
        { input: [], output: { foo: false } }
      ]
    })
  })
})
