import assert from 'node:assert/strict'
import test from 'node:test'
import { createSerialTaskRunner } from '../src/lib/serial-task.js'

test('serial task runner recovers after a rejected task', async () => {
  const runSerialTask = createSerialTaskRunner()

  await assert.rejects(
    runSerialTask(async () => {
      throw new Error('boom')
    }),
    /boom/,
  )

  assert.equal(await runSerialTask(async () => 'ok'), 'ok')
})

test('serial task runner preserves task order', async () => {
  const runSerialTask = createSerialTaskRunner()
  const events: string[] = []

  const first = runSerialTask(async () => {
    events.push('first:start')
    await new Promise((resolve) => setTimeout(resolve, 20))
    events.push('first:end')
  })

  const second = runSerialTask(async () => {
    events.push('second')
  })

  await Promise.all([first, second])

  assert.deepEqual(events, ['first:start', 'first:end', 'second'])
})
