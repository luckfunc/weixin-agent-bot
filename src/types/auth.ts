import type { DeepSeekThinkingMode } from '../llm/deepseek/types.js'

/** Persisted DeepSeek API credentials. */
export interface DeepSeekAuthProfile {
  provider: 'deepseek'
  apiKey?: string
  baseUrl?: string
  model?: string
  thinking?: DeepSeekThinkingMode
}

export type AuthProfile = DeepSeekAuthProfile

export interface AuthStore {
  version: number
  activeProvider?: string
  profiles: Record<string, AuthProfile>
}
