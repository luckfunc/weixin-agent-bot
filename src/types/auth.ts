/** Persisted active provider + keys (see auth/store). */
export interface AuthProfile {
  provider: string
  apiKey?: string
  baseUrl?: string
  model?: string
}

export interface AuthStore {
  version: number
  activeProvider?: string
  profiles: Record<string, AuthProfile>
}

/** Matches @mariozechner/pi-ai/oauth getOAuthApiKey shape. */
export interface CodexAuthFile {
  'openai-codex': {
    type: 'oauth'
    access: string
    refresh: string
    expires: number
    [key: string]: unknown
  }
}
