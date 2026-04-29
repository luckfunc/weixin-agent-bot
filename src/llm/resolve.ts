import type { LlmRuntime } from '@/types/index.js'
import { getActiveProfile } from '../persistence.js'
import { promptDeepSeekSetup } from './deepseek/prompt.js'
import {
  resolveDeepSeekFromEnv,
  resolveDeepSeekFromSavedProfile,
} from './deepseek/resolve.js'

function assertDeepSeekOnly(): void {
  const provider = process.env.PROVIDER?.trim().toLowerCase()
  if (!provider || provider === 'deepseek') return
  throw new Error(
    `Only DeepSeek is supported now; remove PROVIDER=${provider} or set PROVIDER=deepseek.`,
  )
}

/** Resolve DeepSeek backend without prompts (env + saved profile). */
export function tryResolveLlmRuntime(): LlmRuntime | undefined {
  assertDeepSeekOnly()

  const fromEnv = resolveDeepSeekFromEnv()
  if (fromEnv) return { kind: 'deepseek', config: fromEnv }
  const active = getActiveProfile()
  if (active?.provider === 'deepseek') {
    const c = resolveDeepSeekFromSavedProfile(active)
    if (c) return { kind: 'deepseek', config: c }
  }

  return undefined
}

export async function promptLlmRuntime(opts?: {
  forceReauth?: boolean
}): Promise<LlmRuntime> {
  assertDeepSeekOnly()
  const force = opts?.forceReauth ?? false

  if (force) {
    const config = await promptDeepSeekSetup({ forceReauth: true })
    return { kind: 'deepseek', config }
  }

  const resolved = tryResolveLlmRuntime()
  if (resolved) return resolved

  const config = await promptDeepSeekSetup({ forceReauth: false })
  return { kind: 'deepseek', config }
}
