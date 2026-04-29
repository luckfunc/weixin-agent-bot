import type { DeepSeekAuthProfile } from '@/types/index.js'
import { getActiveProfile } from '../../persistence.js'
import { DEFAULT_DEEPSEEK_MODEL } from './constants.js'
import type { DeepSeekConfig, DeepSeekThinkingMode } from './types.js'

function modelFromEnv(): string {
  return (
    process.env.DEEPSEEK_MODEL?.trim() ??
    process.env.MODEL?.trim() ??
    DEFAULT_DEEPSEEK_MODEL
  )
}

function thinkingFromEnv(): DeepSeekThinkingMode | undefined {
  const raw = process.env.DEEPSEEK_THINKING?.trim().toLowerCase()
  if (raw === 'enabled' || raw === 'disabled') return raw
  return undefined
}

/** Non-interactive: `DEEPSEEK_API_KEY` required. */
export function resolveDeepSeekFromEnv(): DeepSeekConfig | undefined {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim()
  if (!apiKey) return undefined
  const baseUrl = process.env.DEEPSEEK_BASE_URL?.trim() || undefined
  return {
    apiKey,
    model: modelFromEnv(),
    baseUrl,
    thinking: thinkingFromEnv(),
  }
}

export function resolveDeepSeekFromSavedProfile(
  profile: DeepSeekAuthProfile,
): DeepSeekConfig | undefined {
  if (!profile.apiKey?.trim()) return undefined
  return {
    apiKey: profile.apiKey.trim(),
    model: profile.model?.trim() ?? modelFromEnv(),
    baseUrl: profile.baseUrl?.trim() || undefined,
    thinking: thinkingFromEnv() ?? profile.thinking,
  }
}

export function tryResolveDeepSeekWithoutPrompt(): DeepSeekConfig | undefined {
  const fromEnv = resolveDeepSeekFromEnv()
  if (fromEnv) return fromEnv
  const saved = getActiveProfile()
  if (saved?.provider === 'deepseek') {
    return resolveDeepSeekFromSavedProfile(saved)
  }
  return undefined
}
