/* global describe, expect, it */
const Boundary = require('../../utils/boundary')

describe('Stand alone boundary tests', function () {
  it('Happy path case', async function () {
    const identity = new Boundary(async function (argv) {
      return argv
    })

    const emptyObject = await identity({})
    const object = await identity({ value: 5 })

    expect(emptyObject).to.deep.equal({})
    expect(object).to.deep.equal({ value: 5 })
  })

  it('Happy path with multiple params case', async function () {
    const add = new Boundary(async function (a, b) {
      return a + b
    })

    const five = await add(3, 2)
    const eight = await add(5, 3)

    expect(five).to.deep.equal(5)
    expect(eight).to.deep.equal(8)
  })

  it('Happy path with arguments case', async function () {
    const add = new Boundary(async function () {
      return [...arguments].reduce((a, b) => a + b, 0)
    })

    const six = await add(3, 2, 1)
    const eight = await add(5, 3)
    const ten = await add(1, 2, 3, 4)

    expect(six).to.deep.equal(6)
    expect(eight).to.deep.equal(8)
    expect(ten).to.deep.equal(10)
  })

  it('Save success one argument case', async function () {
    const identity = new Boundary(async function (argv) {
      return argv
    })

    const emptyObject = await identity({})
    const object = await identity({ value: 5 })

    const tape = identity.getTape()

    expect(tape.length).to.equal(2)
    expect(tape[0]).to.deep.equal({ input: [{}], output: {} })
    expect(tape[1]).to.deep.equal({ input: [{ value: 5 }], output: { value: 5 } })

    expect(emptyObject).to.deep.equal({})
    expect(object).to.deep.equal({ value: 5 })
  })

  it('Save success multiple argument case', async function () {
    const add = new Boundary(async function (a, b) {
      return a + b
    })

    const five = await add(3, 2)
    const eight = await add(5, 3)

    const tape = add.getTape()

    expect(tape.length).to.equal(2)
    expect(tape[0]).to.deep.equal({ input: [3, 2], output: 5 })
    expect(tape[1]).to.deep.equal({ input: [5, 3], output: 8 })

    expect(five).to.deep.equal(5)
    expect(eight).to.deep.equal(8)
  })

  it('Save success with arguments case', async function () {
    const add = new Boundary(async function () {
      return [...arguments].reduce((a, b) => a + b, 0)
    })

    const six = await add(3, 2, 1)
    const eight = await add(5, 3)
    const ten = await add(1, 2, 3, 4)

    const tape = add.getTape()

    expect(tape.length).to.equal(3)
    expect(tape[0]).to.deep.equal({ input: [3, 2, 1], output: 6 })
    expect(tape[1]).to.deep.equal({ input: [5, 3], output: 8 })
    expect(tape[2]).to.deep.equal({ input: [1, 2, 3, 4], output: 10 })

    expect(six).to.deep.equal(6)
    expect(eight).to.deep.equal(8)
    expect(ten).to.deep.equal(10)
  })

  it('Save error with one argument case', async function () {
    const identity = new Boundary(async function (argv) {
      if (!argv.value) {
        throw new Error('Value is needed')
      }

      return argv
    })

    let emptyObject, error
    try {
      emptyObject = await identity({})
    } catch (e) {
      error = e
    }

    const object = await identity({ value: 5 })

    const tape = identity.getTape()

    expect(tape.length).to.equal(2)
    expect(tape[0]).to.deep.equal({ input: [{}], error: 'Value is needed' })
    expect(tape[1]).to.deep.equal({ input: [{ value: 5 }], output: { value: 5 } })

    expect(emptyObject).to.equal(undefined)
    expect(error.message).to.equal('Value is needed')
    expect(object).to.deep.equal({ value: 5 })
  })

  it('Save error with multiple argument case', async function () {
    const add = new Boundary(async function (a, b) {
      if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('Value is need to be a number')
      }

      return a + b
    })

    let emptyObject, error
    try {
      emptyObject = await add('3', 2)
    } catch (e) {
      error = e
    }
    const five = await add(3, 2)
    const eight = await add(5, 3)

    const tape = add.getTape()

    expect(tape.length).to.equal(3)
    expect(tape[0]).to.deep.equal({ input: ['3', 2], error: 'Value is need to be a number' })
    expect(tape[1]).to.deep.equal({ input: [3, 2], output: 5 })
    expect(tape[2]).to.deep.equal({ input: [5, 3], output: 8 })

    expect(emptyObject).to.equal(undefined)
    expect(error.message).to.equal('Value is need to be a number')
    expect(five).to.deep.equal(5)
    expect(eight).to.deep.equal(8)
  })

  it('Save error with arguments case', async function () {
    const add = new Boundary(async function () {
      const arr = [...arguments]
      if (!arr.every(a => typeof a === 'number')) {
        throw new Error('Value is need to be a number')
      }

      return [...arguments].reduce((a, b) => a + b, 0)
    })

    let emptyObject, error
    try {
      emptyObject = await add('3', 2)
    } catch (e) {
      error = e
    }
    const six = await add(3, 2, 1)
    const eight = await add(5, 3)
    const ten = await add(1, 2, 3, 4)

    const tape = add.getTape()

    expect(tape.length).to.equal(4)
    expect(tape[0]).to.deep.equal({ input: ['3', 2], error: 'Value is need to be a number' })
    expect(tape[1]).to.deep.equal({ input: [3, 2, 1], output: 6 })
    expect(tape[2]).to.deep.equal({ input: [5, 3], output: 8 })
    expect(tape[3]).to.deep.equal({ input: [1, 2, 3, 4], output: 10 })

    expect(emptyObject).to.equal(undefined)
    expect(error.message).to.equal('Value is need to be a number')
    expect(six).to.deep.equal(6)
    expect(eight).to.deep.equal(8)
    expect(ten).to.deep.equal(10)
  })
})

describe('Stand alone replay boundary tests', function () {
  it('Happy path case', async function () {
    const identity = new Boundary(async function () {})

    identity.setTape([
      { input: [{}], output: {} },
      { input: [{ value: 5 }], output: { value: 5 } }
    ])
    identity.setMode('replay')

    const emptyObject = await identity({})
    const object = await identity({ value: 5 })

    expect(emptyObject).to.deep.equal({})
    expect(object).to.deep.equal({ value: 5 })
  })

  it('No tape value case', async function () {
    const identity = new Boundary(async function () {})

    identity.setTape([
      { input: [{}], output: {} }
    ])
    identity.setMode('replay')

    const emptyObject = await identity({})

    let object, error
    try {
      object = await identity({ value: 5 })
    } catch (e) {
      error = e
    }

    expect(emptyObject).to.deep.equal({})
    expect(object).to.equal(undefined)
    expect(error.message).to.equal('No tape value for this inputs')
  })

  it('Error as tape result case', async function () {
    const identity = new Boundary(async function (argv) {})
    identity.setTape([
      { input: [{}], error: 'Value is needed' },
      { input: [{ value: 5 }], output: { value: 5 } }
    ])
    identity.setMode('replay')

    let emptyObject, error
    try {
      emptyObject = await identity({})
    } catch (e) {
      error = e
    }

    const object = await identity({ value: 5 })

    expect(emptyObject).to.equal(undefined)
    expect(error.message).to.equal('Value is needed')
    expect(object).to.deep.equal({ value: 5 })
  })
})
