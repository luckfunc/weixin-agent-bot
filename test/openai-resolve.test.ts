import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveOpenAiFromEnv } from '../src/llm/openai/resolve.js'
import { withEnv } from './helpers.js'

test('OPENAI_API_KEY resolves with defaults', async () => {
  await withEnv(
    {
      OPENAI_API_KEY: 'sk-test',
      OPENAI_MODEL: undefined,
      MODEL: undefined,
      OPENAI_BASE_URL: undefined,
    },
    () => {
      assert.deepEqual(resolveOpenAiFromEnv(), {
        apiKey: 'sk-test',
        model: 'gpt-5.4-mini',
        baseUrl: undefined,
      })
    },
  )
})

test('MODEL applies when OPENAI_MODEL is unset', async () => {
  await withEnv(
    {
      OPENAI_API_KEY: 'sk-test',
      OPENAI_MODEL: undefined,
      MODEL: 'o3',
    },
    () => {
      assert.deepEqual(resolveOpenAiFromEnv(), {
        apiKey: 'sk-test',
        model: 'o3',
        baseUrl: undefined,
      })
    },
  )
})

test('OPENAI_MODEL wins when both it and MODEL are set', async () => {
  await withEnv(
    {
      OPENAI_API_KEY: 'sk-test',
      OPENAI_MODEL: 'gpt-4o',
      MODEL: 'o3',
    },
    () => {
      assert.deepEqual(resolveOpenAiFromEnv(), {
        apiKey: 'sk-test',
        model: 'gpt-4o',
        baseUrl: undefined,
      })
    },
  )
})

test('missing OPENAI_API_KEY yields undefined', async () => {
  await withEnv(
    {
      OPENAI_API_KEY: undefined,
    },
    () => {
      assert.equal(resolveOpenAiFromEnv(), undefined)
    },
  )
})
