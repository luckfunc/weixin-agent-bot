export type DeepSeekThinkingMode = 'enabled' | 'disabled'

/** Runtime DeepSeek client settings (env, saved profile, or prompts). */
export interface DeepSeekConfig {
  apiKey: string
  model: string
  /** Optional API base URL. Defaults to DeepSeek's official endpoint. */
  baseUrl?: string
  /** Optional AI SDK DeepSeek thinking-mode override. */
  thinking?: DeepSeekThinkingMode
}
