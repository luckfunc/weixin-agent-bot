/** Persisted OpenAI API credentials (see persistence/auth-store). */
export interface OpenAiAuthProfile {
  provider: 'openai'
  apiKey?: string
  baseUrl?: string
  model?: string
}

/** Last-selected Codex model; OAuth tokens live in codex-auth.json. */
export interface CodexAuthProfile {
  provider: 'codex'
  model?: string
}

export type AuthProfile = OpenAiAuthProfile | CodexAuthProfile

export interface AuthStore {
  version: number
  activeProvider?: string
  profiles: Record<string, AuthProfile>
}

/** Shape stored in `codex-auth.json` for @mariozechner/pi-ai OAuth. */
export interface CodexAuthFile {
  'openai-codex': {
    type: 'oauth'
    access: string
    refresh: string
    expires: number
    [key: string]: unknown
  }
}
