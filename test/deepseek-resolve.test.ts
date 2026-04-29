import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveDeepSeekFromEnv } from '../src/llm/deepseek/resolve.js'
import { withEnv } from './helpers.js'

test('DEEPSEEK_API_KEY resolves with defaults', async () => {
  await withEnv(
    {
      DEEPSEEK_API_KEY: 'sk-test',
      DEEPSEEK_MODEL: undefined,
      MODEL: undefined,
      DEEPSEEK_BASE_URL: undefined,
      DEEPSEEK_THINKING: undefined,
    },
    () => {
      assert.deepEqual(resolveDeepSeekFromEnv(), {
        apiKey: 'sk-test',
        model: 'deepseek-v4-flash',
        baseUrl: undefined,
        thinking: undefined,
      })
    },
  )
})

test('MODEL applies when DEEPSEEK_MODEL is unset', async () => {
  await withEnv(
    {
      DEEPSEEK_API_KEY: 'sk-test',
      DEEPSEEK_MODEL: undefined,
      MODEL: 'deepseek-v4-pro',
    },
    () => {
      assert.deepEqual(resolveDeepSeekFromEnv(), {
        apiKey: 'sk-test',
        model: 'deepseek-v4-pro',
        baseUrl: undefined,
        thinking: undefined,
      })
    },
  )
})

test('DEEPSEEK_MODEL wins when both it and MODEL are set', async () => {
  await withEnv(
    {
      DEEPSEEK_API_KEY: 'sk-test',
      DEEPSEEK_MODEL: 'deepseek-chat',
      MODEL: 'deepseek-v4-pro',
    },
    () => {
      assert.deepEqual(resolveDeepSeekFromEnv(), {
        apiKey: 'sk-test',
        model: 'deepseek-chat',
        baseUrl: undefined,
        thinking: undefined,
      })
    },
  )
})

test('DEEPSEEK_THINKING accepts enabled and disabled', async () => {
  await withEnv(
    {
      DEEPSEEK_API_KEY: 'sk-test',
      DEEPSEEK_THINKING: 'enabled',
    },
    () => {
      assert.equal(resolveDeepSeekFromEnv()?.thinking, 'enabled')
    },
  )

  await withEnv(
    {
      DEEPSEEK_API_KEY: 'sk-test',
      DEEPSEEK_THINKING: 'disabled',
    },
    () => {
      assert.equal(resolveDeepSeekFromEnv()?.thinking, 'disabled')
    },
  )
})

test('missing DEEPSEEK_API_KEY yields undefined', async () => {
  await withEnv(
    {
      DEEPSEEK_API_KEY: undefined,
    },
    () => {
      assert.equal(resolveDeepSeekFromEnv(), undefined)
    },
  )
})
