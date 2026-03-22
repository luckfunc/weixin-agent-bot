import type { OpenAiAuthProfile } from '@/types/index.js'
import { getActiveProfile } from '../../persistence.js'
import { DEFAULT_OPENAI_MODEL } from './constants.js'
import type { OpenAiConfig } from './types.js'

function modelFromEnv(): string {
  return (
    process.env.OPENAI_MODEL?.trim() ??
    process.env.MODEL?.trim() ??
    DEFAULT_OPENAI_MODEL
  )
}

/** Non-interactive: `OPENAI_API_KEY` required. */
export function resolveOpenAiFromEnv(): OpenAiConfig | undefined {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return undefined
  const baseUrl = process.env.OPENAI_BASE_URL?.trim() || undefined
  return {
    apiKey,
    model: modelFromEnv(),
    baseUrl,
  }
}

export function resolveOpenAiFromSavedProfile(
  profile: OpenAiAuthProfile,
): OpenAiConfig | undefined {
  if (!profile.apiKey?.trim()) return undefined
  return {
    apiKey: profile.apiKey.trim(),
    model: profile.model?.trim() ?? modelFromEnv(),
    baseUrl: profile.baseUrl?.trim() || undefined,
  }
}

export function tryResolveOpenAiWithoutPrompt(): OpenAiConfig | undefined {
  const fromEnv = resolveOpenAiFromEnv()
  if (fromEnv) return fromEnv
  const saved = getActiveProfile()
  if (saved?.provider === 'openai') {
    return resolveOpenAiFromSavedProfile(saved)
  }
  return undefined
}
