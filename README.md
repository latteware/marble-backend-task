## Marble seeds backend template

## Install with

```
npm i @marble-seeds/@marble-seeds/tasks
```

## Docs

In your tasks folder create your file with

```
const Task = require('@marble-seeds/tasks')

const task = new Task(async function (argv) {
  console.log(argv)

  return { foo: true }
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
```

The last part will allow you to call it as a CLI or be loaded on your app and run as part of you app

## Task philosophy

Task are small units of logic that should be repetable and composable.

Task to be able have repetable tasks, we need to care about 2 concepts:
- *Input/Output*: To handle the inputs and outputs of a task in a easy way, task are build to be black boxes.
- *Boundaries of the box*

By carring about this elements logs test of task can be created by recording the 3 elements and then replay them.

### boundary

To be able to treat task as black boxes, all the interactions to fetch data, save elements need to be moved to boundaries.

```
const task = new Task(async function (argv, { getData }) {
  const data = async getData()
  console.log(argv, data)

  return { ...data, ...argv }
}, {
  boundaries : {
    getData: async () => {
      // someting
      return data
    }
  }
})
```

By defining bounderies in this form, we can record the interactions from the task with other elements allowing to track them and mock them.

Boundary have 4 modes:

- Proxy: execute the function and records it
- Proxy-pass: review if the input exist, it it exist returns the previous value and if not execute the functions
- Proxy-catch: executes the function and if it throws and error, it tries to use a previews output if it exists for the input.
- Replay: review if the input exist and if it doesnt throws and error.

With this modes bounderies can be used as cache or to generate test by passing the data to a RecordTape to re-run the calls.

## Task API

### constructor

Takes a task action(function) and a timeout as params.

### run

Runs the task action asynchronously. Takes the function arguments and a config object with a timeout option.

### setCliHandlers

Lets the taks that it will run as a CLI program.


# ToDos

- CLI run test and argv handler
- Document boundaries

