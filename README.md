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