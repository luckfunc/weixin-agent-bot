import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import type { CodexAuthFile } from '#types'
import { writeSecretJson } from '../../lib/secret-file.js'

export type { CodexAuthFile } from '#types'

const defaultPath = path.join(homedir(), '.weixin-gpt', 'codex-auth.json')

export function codexAuthPath(): string {
  return process.env.CODEX_AUTH_PATH ?? defaultPath
}

export function loadCodexAuth(): CodexAuthFile | null {
  const p = codexAuthPath()
  if (!existsSync(p)) return null
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as CodexAuthFile
  } catch {
    return null
  }
}

export function saveCodexAuth(data: CodexAuthFile): void {
  const p = codexAuthPath()
  writeSecretJson(p, data)
}
