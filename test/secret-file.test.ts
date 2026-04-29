import assert from 'node:assert/strict'
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { loadAuthStore, setActiveAuth } from '../src/persistence.js'
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
        setActiveAuth({ provider: 'deepseek', apiKey: 'sk-test' })
      },
    )

    assert.equal(statSync(authPath).mode & 0o777, 0o600)
    assert.equal(statSync(path.dirname(authPath)).mode & 0o777, 0o700)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('invalid saved auth store throws instead of looking like first run', async () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'wab-auth-invalid-'))
  const authPath = path.join(tempDir, 'broken', 'auth.json')

  mkdirSync(path.dirname(authPath), { recursive: true })
  writeFileSync(authPath, '{broken json', 'utf-8')

  try {
    await withEnv(
      {
        AUTH_STORE_PATH: authPath,
      },
      () => {
        assert.throws(
          () => loadAuthStore(),
          /Saved auth store .* is not valid JSON/,
        )
      },
    )
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('setActiveAuth can overwrite a corrupted saved auth store', async () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'wab-auth-repair-'))
  const authPath = path.join(tempDir, 'broken', 'auth.json')

  mkdirSync(path.dirname(authPath), { recursive: true })
  writeFileSync(authPath, '{broken json', 'utf-8')

  try {
    await withEnv(
      {
        AUTH_STORE_PATH: authPath,
      },
      () => {
        setActiveAuth({ provider: 'deepseek', apiKey: 'sk-test' })

        assert.deepEqual(loadAuthStore(), {
          version: 1,
          activeProvider: 'deepseek',
          profiles: {
            deepseek: {
              provider: 'deepseek',
              apiKey: 'sk-test',
            },
          },
        })
      },
    )
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})
