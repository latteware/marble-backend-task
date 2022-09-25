/* global describe, expect, it */
const Task = require('../../index')

describe('Change modes', function () {
  it('On task start, boundaries should start in the same mode', async function () {
    const add = new Task(async (argv, { fetchIncrement }) => {
      const increment = await fetchIncrement(argv)

      return argv.value + increment
    }, {
      boundaries: {
        fetchIncrement: async (argv) => {
          return argv.value
        }
      },
      mode: 'proxy-catch'
    })

    const { fetchIncrement } = add.getBoundaries()

    expect(fetchIncrement.getMode()).to.equal('proxy-catch')
  })

  it('On task mode change, boundaries should change to the same', async function () {
    const add = new Task(async (argv, { fetchIncrement }) => {
      const increment = await fetchIncrement(argv)

      return argv.value + increment
    }, {
      boundaries: {
        fetchIncrement: async (argv) => {
          return argv.value
        }
      },
      mode: 'proxy-catch'
    })

    const { fetchIncrement: original } = add.getBoundaries()
    expect(original.getMode()).to.equal('proxy-catch')

    add.setMode('replay')

    const { fetchIncrement: updated } = add.getBoundaries()
    expect(updated.getMode()).to.equal('replay')
  })
})
