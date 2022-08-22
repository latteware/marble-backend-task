/* global describe, expect, it */
const Task = require('../../index')

describe('Base test', function () {
  it('Indentity test', async function () {
    const indentity = new Task(function (argv) {
      return argv
    })

    const { bar } = await indentity.run({ bar: true })
    const { foo } = await indentity.run({ foo: true })

    expect(bar).to.equal(true)
    expect(foo).to.equal(true)
  })

  it('Add test', async function () {
    const add2 = new Task(function (int) {
      return int + 2
    })

    const six = await add2.run(4)
    const seven = await add2.run(5)

    expect(six).to.equal(6)
    expect(seven).to.equal(7)
  })
})
