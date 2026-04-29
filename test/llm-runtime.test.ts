import assert from 'node:assert/strict'
import test from 'node:test'
import { tryResolveLlmRuntime } from '../src/llm/resolve.js'
import { withEnv } from './helpers.js'

test('PROVIDER=deepseek resolves DeepSeek API config', async () => {
  await withEnv(
    {
      PROVIDER: 'deepseek',
      DEEPSEEK_API_KEY: 'sk-test',
      DEEPSEEK_MODEL: 'deepseek-v4-pro',
      MODEL: undefined,
    },
    () => {
      assert.deepEqual(tryResolveLlmRuntime(), {
        kind: 'deepseek',
        config: {
          apiKey: 'sk-test',
          model: 'deepseek-v4-pro',
          baseUrl: undefined,
          thinking: undefined,
        },
      })
    },
  )
})

test('unsupported providers are rejected', async () => {
  await withEnv(
    {
      PROVIDER: 'legacy',
      DEEPSEEK_API_KEY: 'sk-test',
    },
    () => {
      assert.throws(
        () => tryResolveLlmRuntime(),
        /Only DeepSeek is supported now/,
      )
    },
  )
})
