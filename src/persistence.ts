import { homedir } from 'node:os'
import path from 'node:path'
import type { AuthProfile, AuthStore } from '@/types/index.js'
import {
  InvalidConfigFileError,
  readOptionalJsonFile,
} from './lib/json-file.js'
import { writeSecretJson } from './lib/secret-file.js'

const defaultDir = path.join(homedir(), '.weixin-agent-bot')
const defaultPath = path.join(defaultDir, 'auth.json')

function storePath(): string {
  return process.env.AUTH_STORE_PATH ?? defaultPath
}

export function loadAuthStore(): AuthStore {
  const p = storePath()
  return (
    readOptionalJsonFile<AuthStore>(p, 'Saved auth store') ?? {
      version: 1,
      profiles: {},
    }
  )
}

export function saveAuthStore(store: AuthStore): void {
  const p = storePath()
  writeSecretJson(p, store)
}

export function getActiveProfile(): AuthProfile | undefined {
  const store = loadAuthStore()
  if (!store.activeProvider) return undefined
  return store.profiles[store.activeProvider]
}

export function setActiveAuth(profile: AuthProfile): void {
  let store: AuthStore
  try {
    store = loadAuthStore()
  } catch (error) {
    if (!(error instanceof InvalidConfigFileError)) {
      throw error
    }
    console.warn(`${error.message} Overwriting it with a new auth store.`)
    store = { version: 1, profiles: {} }
  }
  store.activeProvider = profile.provider
  store.profiles[profile.provider] = profile
  saveAuthStore(store)
}
