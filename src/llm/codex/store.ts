import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import type { CodexAuthFile } from '@/types/index.js'
import { writeSecretJson } from '../../lib/secret-file.js'

export function codexAuthPath(): string {
  return (
    process.env.CODEX_AUTH_PATH ??
    path.join(homedir(), '.weixin-agent-bot', 'codex-auth.json')
  )
}

export function loadCodexAuth(): CodexAuthFile | undefined {
  const p = codexAuthPath()
  if (!existsSync(p)) return undefined
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as CodexAuthFile
  } catch {
    return undefined
  }
}

export function saveCodexAuth(data: CodexAuthFile): void {
  writeSecretJson(codexAuthPath(), data)
}
