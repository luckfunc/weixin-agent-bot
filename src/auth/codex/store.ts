import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

/** Matches @mariozechner/pi-ai/oauth getOAuthApiKey shape. */
export interface CodexAuthFile {
  'openai-codex': { type: 'oauth'; access: string; refresh: string; expires: number; [key: string]: unknown }
}

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
  mkdirSync(path.dirname(p), { recursive: true })
  writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8')
}
