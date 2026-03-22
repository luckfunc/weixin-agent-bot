import { loadCodexAuth } from './codex/store.js'
import type { LlmMode } from '../llm/types.js'

/**
 * Resolve LLM mode from environment variables without user interaction.
 * Returns undefined when nothing is configured (caller should prompt).
 */
export function resolveFromEnv(): LlmMode | undefined {
  if (process.env.LLM_MODE === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('LLM_MODE=openai requires OPENAI_API_KEY')
    }
    return 'openai'
  }
  if (process.env.LLM_MODE === 'codex') return 'codex'
  if (process.env.OPENAI_API_KEY) return 'openai'
  if (loadCodexAuth()) return 'codex'
  return undefined
}
