import assert from 'node:assert'
import test from 'node:test'
import { runShellCommand } from '../src/llm/tool-runtime.js'

test('runShellCommand runs echo', async () => {
  const out = await runShellCommand('echo weixin-agent-test')
  assert.ok(out.includes('weixin-agent-test'), out)
})
