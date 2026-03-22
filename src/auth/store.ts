import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import type { AuthProfile, AuthStore } from '@/types/index.js'
import { writeSecretJson } from '../lib/secret-file.js'

export type { AuthProfile, AuthStore } from '@/types/index.js'

const defaultDir = path.join(homedir(), '.weixin-agent-bot')
const defaultPath = path.join(defaultDir, 'auth.json')

function storePath(): string {
  return process.env.AUTH_STORE_PATH ?? defaultPath
}

export function loadAuthStore(): AuthStore {
  const p = storePath()
  if (!existsSync(p)) return { version: 1, profiles: {} }
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as AuthStore
  } catch {
    return { version: 1, profiles: {} }
  }
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

export function setActiveProvider(providerId: string, profile: AuthProfile): void {
  const store = loadAuthStore()
  store.activeProvider = providerId
  store.profiles[providerId] = profile
  saveAuthStore(store)
}
