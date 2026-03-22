import type { OpenAiConfig } from '../llm/openai/types.js'

/** How the bot talks to GPT: official API key or ChatGPT/Codex browser OAuth. */
export type LlmRuntime =
  | { kind: 'openai-api'; config: OpenAiConfig }
  | { kind: 'codex'; model: string }

export interface WeixinBotOptions {
  llm: LlmRuntime
  forceLogin: boolean
}
