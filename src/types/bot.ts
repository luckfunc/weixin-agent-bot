import type { DeepSeekConfig } from '../llm/deepseek/types.js'

/** How the bot talks to DeepSeek through the AI SDK. */
export type LlmRuntime = { kind: 'deepseek'; config: DeepSeekConfig }

export interface WeixinBotOptions {
  llm: LlmRuntime
  forceLogin: boolean
}
