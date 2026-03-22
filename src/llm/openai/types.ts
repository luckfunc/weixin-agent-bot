/** Runtime OpenAI client settings (env, saved profile, or prompts). */
export interface OpenAiConfig {
  apiKey: string
  model: string
  /** Optional API base URL (proxies / Azure OpenAI-style endpoints). */
  baseUrl?: string
}

export interface FetchModelsOptions {
  apiKey: string
  baseUrl?: string
}
