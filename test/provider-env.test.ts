import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { resolveProviderFromEnv } from '../src/auth/prompt.js'
import { withEnv } from './helpers.js'

test('explicit ollama provider resolves without interactive auth', async () => {
  await withEnv(
    {
      PROVIDER: 'ollama',
      MODEL: 'qwen2.5',
      OLLAMA_BASE_URL: 'http://127.0.0.1:11434/v1/',
    },
    () => {
      assert.deepEqual(resolveProviderFromEnv(), {
        id: 'ollama',
        label: 'Ollama (local)',
        baseUrl: 'http://127.0.0.1:11434/v1/',
        model: 'qwen2.5',
      })
    },
  )
})

test('explicit codex provider resolves when cached auth exists', async () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'wab-codex-auth-'))
  const authPath = path.join(tempDir, 'codex-auth.json')

  writeFileSync(
    authPath,
    JSON.stringify({
      'openai-codex': {
        type: 'oauth',
        access: 'access-token',
        refresh: 'refresh-token',
        expires: Date.now() + 60_000,
      },
    }),
    'utf-8',
  )

  try {
    await withEnv(
      {
        PROVIDER: 'codex',
        CODEX_AUTH_PATH: authPath,
        CODEX_MODEL: 'gpt-5.2',
      },
      () => {
        assert.deepEqual(resolveProviderFromEnv(), {
          id: 'codex',
          label: 'ChatGPT / Codex',
          model: 'gpt-5.2',
        })
      },
    )
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('global MODEL override also applies to api-key providers', async () => {
  await withEnv(
    {
      PROVIDER: 'openai',
      OPENAI_API_KEY: 'sk-test',
      MODEL: 'o3',
      OPENAI_MODEL: undefined,
    },
    () => {
      assert.deepEqual(resolveProviderFromEnv(), {
        id: 'openai',
        label: 'OpenAI',
        apiKey: 'sk-test',
        baseUrl: undefined,
        model: 'o3',
      })
    },
  )
})
