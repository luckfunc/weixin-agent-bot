import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { tryResolveLlmRuntime } from '../src/llm/resolve.js'
import { withEnv } from './helpers.js'

test('PROVIDER=codex resolves when codex token file exists', async () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'wab-codex-rt-'))
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
        MODEL: undefined,
        OPENAI_API_KEY: undefined,
      },
      () => {
        assert.deepEqual(tryResolveLlmRuntime(), {
          kind: 'codex',
          model: 'gpt-5.2',
        })
      },
    )
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})
