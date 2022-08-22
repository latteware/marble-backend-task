/* global describe, before, expect, it */
const lov = require('lov')
const Task = require('../../index')

describe('Validation tests', function () {
  let task
  before(() => {
    const schema = {
      value: lov.number().required()
    }

    task = new Task(function (argv) {
      return argv
    })

    task.setSchema(schema)
  })

  it('Should be invalid', function () {
    const isValid = task.validate({ value: null })

    expect(isValid.error).to.not.equal(null)
  })

  it('Should be valid', function () {
    const isValid = task.validate({ value: 5 })

    expect(isValid.error).to.equal(null)
  })

  it('Should validate data as past of run funcion', async function () {
    let error
    try {
      await task.run({ value: null })
    } catch (e) {
      error = e
    }

    expect(error.message).to.equal('value: missing required value')
  })

  it('Should work well', async function () {
    const result = await task.run({ value: 5 })

    expect(result.value).to.equal(5)
  })
})

describe('Validation multiple values tests', function () {
  let task
  before(() => {
    const schema = {
      value: lov.number().required(),
      increment: lov.number().required()
    }

    task = new Task(function (argv) {
      return argv
    })

    task.setSchema(schema)
  })

  it('Should be on both invalid but fail in first', async function () {
    let error
    try {
      await task.run({ value: null })
    } catch (e) {
      error = e
    }

    expect(error.message).to.equal('value: missing required value')
  })

  it('Should be on both invalid but fail in increment', async function () {
    let error
    try {
      await task.run({ value: 5 })
    } catch (e) {
      error = e
    }

    expect(error.message).to.equal('increment: missing required value')
  })

  it('Should work well', async function () {
    const result = await task.run({ value: 5, increment: 1 })

    expect(result.value).to.equal(5)
    expect(result.increment).to.equal(1)
  })
})
