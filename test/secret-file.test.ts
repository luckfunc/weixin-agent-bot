import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, statSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { saveCodexAuth } from '../src/llm/codex/store.js'
import { setActiveAuth } from '../src/persistence.js'
import { withEnv } from './helpers.js'

const skipOnWindows = process.platform === 'win32'

test('auth store writes provider secrets with private permissions', {
  skip: skipOnWindows,
}, async () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'wab-auth-store-'))
  const authPath = path.join(tempDir, 'secret', 'auth.json')

  try {
    await withEnv(
      {
        AUTH_STORE_PATH: authPath,
      },
      () => {
        setActiveAuth({ provider: 'openai', apiKey: 'sk-test' })
      },
    )

    assert.equal(statSync(authPath).mode & 0o777, 0o600)
    assert.equal(statSync(path.dirname(authPath)).mode & 0o777, 0o700)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('codex auth store writes oauth secrets with private permissions', {
  skip: skipOnWindows,
}, async () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'wab-codex-store-'))
  const authPath = path.join(tempDir, 'secret', 'codex.json')

  try {
    await withEnv(
      {
        CODEX_AUTH_PATH: authPath,
      },
      () => {
        saveCodexAuth({
          'openai-codex': {
            type: 'oauth',
            access: 'access-token',
            refresh: 'refresh-token',
            expires: Date.now() + 60_000,
          },
        })
      },
    )

    assert.equal(statSync(authPath).mode & 0o777, 0o600)
    assert.equal(statSync(path.dirname(authPath)).mode & 0o777, 0o700)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})
