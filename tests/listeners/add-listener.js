/* global describe, expect, it */
const Schema = require('@marble-seeds/schema')
const { types } = Schema

const Task = require('../../index')

describe('Listener tests', function () {
  it('Should be record one item', async function () {
    const tape = []
    const task = new Task(function (argv) {
      return argv
    })

    task.addListener((record) => {
      tape.push(record)
    })

    await task.run({ value: 5 })

    expect(tape.length).to.equal(1)
    expect(tape[0].input).to.deep.equal({ value: 5 })
    expect(tape[0].output).to.deep.equal({ value: 5 })
  })

  it('Should be record execution error', async function () {
    const tape = []
    const task = new Task(function (argv) {
      throw new Error('This should happen')
    })

    task.addListener((record) => {
      tape.push(record)
    })

    try {
      await task.run({ value: 5 })
    } catch (e) {}

    expect(tape.length).to.equal(1)
    expect(tape[0].input).to.deep.equal({ value: 5 })
    expect(tape[0].error).to.deep.equal('This should happen')
  })

  it('Should be record validation error', async function () {
    const tape = []
    const task = new Task(function (argv) {
      return argv
    })

    task.setSchema({
      value: types.number.required()
    })

    task.addListener((record) => {
      tape.push(record)
    })

    try {
      await task.run({ value: null })
    } catch (e) {}

    expect(tape.length).to.equal(1)
    expect(tape[0].input).to.deep.equal({ value: null })
    expect(tape[0].error).to.deep.equal('"value" must be a number')
  })

  it('Should be multiple records', async function () {
    const tape = []
    const task = new Task(function (argv) {
      return argv
    })

    task.addListener((record) => {
      tape.push(record)
    })

    await task.run({ value: 5 })
    await task.run({ value: 6 })

    expect(tape.length).to.equal(2)
    expect(tape[0].input).to.deep.equal({ value: 5 })
    expect(tape[0].output).to.deep.equal({ value: 5 })

    expect(tape[1].input).to.deep.equal({ value: 6 })
    expect(tape[1].output).to.deep.equal({ value: 6 })
  })

  it('Should be stop record', async function () {
    const tape = []
    const task = new Task(function (argv) {
      return argv
    })

    task.addListener((record) => {
      tape.push(record)
    })

    await task.run({ value: 5 })

    task.removeListener()
    await task.run({ value: 6 })

    expect(tape.length).to.equal(1)
    expect(tape[0].input).to.deep.equal({ value: 5 })
    expect(tape[0].output).to.deep.equal({ value: 5 })
  })
})
