/* global describe, expect, it */
// const lov = require('lov')
const Task = require('../../index')

const getPackageJsonTape = require('./fixtures/get-package-json-tape.json')
const emptyBounderiesTape = require('./fixtures/empty-bounderies-tape.json')

const TapeMock = class {
  constructor (mockTape) {
    this._log = mockTape.log
    this._boundaries = mockTape.boundaries
  }

  getMode () {
    return 'proxy'
  }

  getBoundaries () {
    return this._boundaries
  }

  addLogItem (item) {
    if (this._mode === 'replay') {
      return
    }

    if (
      (item.input && item.output) ||
      (item.input && item.error)
    ) {
      return this._log.push(item)
    }
  }

  addBoundariesData (boundaries) {
    this._boundaries = boundaries
  }
}

describe('RecordTo tests', function () {
  it('Should have on boundaty loaded at the start', async function () {
    const mockTape = new TapeMock(getPackageJsonTape)

    const task = new Task(function (argv) {
      return argv
    }, {
      boundaries: {
        getFileContent: async ({ org, repo, filePath }) => {}
      },
      recordTo: mockTape
    })

    const boundaries = task.getBoundaries()
    expect(boundaries.getFileContent).to.not.equal(undefined)

    const boundaryTape = boundaries.getFileContent.getTape()
    expect(boundaryTape.length).to.equal(1)
    expect(boundaryTape).to.deep.equal(getPackageJsonTape.boundaries.getFileContent)
  })

  it('Should load empity boundaty at the start', async function () {
    const mockTape = new TapeMock(emptyBounderiesTape)

    const task = new Task(function (argv) {
      return argv
    }, {
      boundaries: {
        getFileContent: async ({ org, repo, filePath }) => {}
      },
      recordTo: mockTape
    })

    const boundaries = task.getBoundaries()
    expect(boundaries.getFileContent).to.not.equal(undefined)

    const boundaryTape = boundaries.getFileContent.getTape()
    expect(boundaryTape.length).to.equal(0)
  })

  it('Should have on boundaty loaded at the start', async function () {
    const mockTape = new TapeMock({ ...getPackageJsonTape })

    const task = new Task(async (argv, { getFileContent }) => {
      await getFileContent(argv)

      return argv
    }, {
      boundaries: {
        getFileContent: async ({ org, repo, filePath }) => {
          return { org, repo, filePath }
        }
      },
      recordTo: mockTape
    })

    await task.run({
      org: 'latteware',
      repo: 'repo',
      filePath: 'package.json'
    })

    const boundaries = task.getBoundaries()
    expect(boundaries.getFileContent).to.not.equal(undefined)

    const boundaryTape = boundaries.getFileContent.getTape()
    expect(boundaryTape.length).to.equal(2)
  })
})
