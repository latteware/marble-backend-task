/* global describe, expect, it */
const Task = require('../../index')

// Need to add proxy cache mode to the boundaries
describe.skip('Boundaries tasks tests', function () {
  it('Indentity + boundaries test', async function () {
    const indentity = new Task(async (argv, boundaries) => {
      const externalData = await boundaries.fetchExternalData()

      return { ...externalData, ...argv }
    }, {
      boundaries: {
        fetchExternalData: async () => {
          return { foo: false }
        }
      }
    })

    const object = await indentity.run({ bar: true })
    const { foo } = await indentity.run({ foo: true })

    expect(object).to.deep.equal({ bar: true, foo: false })
    expect(foo).to.equal(true)
  })

  it('Indentity test with tape data', async function () {
    const indentity = new Task(async (argv, boundaries) => {
      const externalData = await boundaries.fetchExternalData()

      return { ...externalData, ...argv }
    }, {
      boundaries: {
        fetchExternalData: async () => {}
      },
      boundariesTape: {
        fetchExternalData: [
          { input: [], output: { foo: false } }
        ]
      }
    })

    const object = await indentity.run({ bar: true })
    const { foo } = await indentity.run({ foo: true })

    expect(object).to.deep.equal({ bar: true, foo: false })
    expect(foo).to.equal(true)
  })

  it('Add task with boundaries test', async function () {
    const add = new Task(async function (int, boundaries) {
      const externalData = await boundaries.fetchExternalData(1)

      return int + externalData
    }, {
      boundaries: {
        fetchExternalData: async (int) => {
          return int * 2
        }
      }
    })

    const six = await add.run(4)
    const seven = await add.run(5)

    expect(six).to.equal(6)
    expect(seven).to.equal(7)
  })

  it('Add task + boundaries + tape test', async function () {
    const add = new Task(async function (int, boundaries) {
      const externalData = await boundaries.fetchExternalData(1)

      return int + externalData
    }, {
      boundaries: {
        fetchExternalData: async (int) => {
          return int * 2
        }
      },
      boundariesTape: {
        fetchExternalData: [
          { input: [1], output: 2 }
        ]
      }
    })

    const six = await add.run(4)
    const seven = await add.run(5)

    expect(six).to.equal(6)
    expect(seven).to.equal(7)
  })
})
