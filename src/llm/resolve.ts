import { cancel, isCancel, select } from '@clack/prompts'
import type { LlmRuntime } from '@/types/index.js'
import { getActiveProfile } from '../persistence.js'
import { DEFAULT_CODEX_MODEL } from './codex/constants.js'
import { promptCodexSetup } from './codex/prompt.js'
import { loadCodexAuth } from './codex/store.js'
import { promptOpenAiSetup } from './openai/prompt.js'
import {
  resolveOpenAiFromEnv,
  resolveOpenAiFromSavedProfile,
} from './openai/resolve.js'

function codexModelFromEnv(): string {
  return (
    process.env.CODEX_MODEL?.trim() ??
    process.env.MODEL?.trim() ??
    DEFAULT_CODEX_MODEL
  )
}

/** Resolve GPT backend without prompts (env + saved profiles + Codex token file). */
export function tryResolveLlmRuntime(): LlmRuntime | undefined {
  const prov = process.env.PROVIDER?.trim().toLowerCase()

  if (prov === 'codex') {
    if (!loadCodexAuth()) return undefined
    const active = getActiveProfile()
    const model =
      active?.provider === 'codex' && active.model?.trim()
        ? active.model.trim()
        : codexModelFromEnv()
    return { kind: 'codex', model }
  }

  if (prov === 'openai') {
    const fromEnv = resolveOpenAiFromEnv()
    if (fromEnv) return { kind: 'openai-api', config: fromEnv }
    const active = getActiveProfile()
    if (active?.provider === 'openai') {
      const c = resolveOpenAiFromSavedProfile(active)
      if (c) return { kind: 'openai-api', config: c }
    }
    return undefined
  }

  const fromEnv = resolveOpenAiFromEnv()
  if (fromEnv) return { kind: 'openai-api', config: fromEnv }

  const active = getActiveProfile()
  if (active?.provider === 'openai') {
    const c = resolveOpenAiFromSavedProfile(active)
    if (c) return { kind: 'openai-api', config: c }
  }
  if (active?.provider === 'codex' && loadCodexAuth()) {
    return {
      kind: 'codex',
      model: active.model?.trim() ?? codexModelFromEnv(),
    }
  }

  return undefined
}

export async function promptLlmRuntime(opts?: {
  forceReauth?: boolean
}): Promise<LlmRuntime> {
  const force = opts?.forceReauth ?? false

  if (force) {
    const mode = await select({
      message: 'Sign in method',
      options: [
        {
          value: 'openai-api' as const,
          label: 'OpenAI API key',
          hint: 'platform.openai.com API keys',
        },
        {
          value: 'codex' as const,
          label: 'ChatGPT / Codex (browser)',
          hint: 'OAuth — no API key',
        },
      ],
    })
    if (isCancel(mode)) {
      cancel('Cancelled')
      process.exit(0)
    }
    if (mode === 'codex') {
      const model = await promptCodexSetup({ forceReauth: true })
      return { kind: 'codex', model }
    }
    const config = await promptOpenAiSetup({ forceReauth: true })
    return { kind: 'openai-api', config }
  }

  const resolved = tryResolveLlmRuntime()
  if (resolved) return resolved

  const mode = await select({
    message: 'How do you want to use GPT?',
    options: [
      {
        value: 'openai-api' as const,
        label: 'OpenAI API key',
        hint: 'sk-... from platform.openai.com',
      },
      {
        value: 'codex' as const,
        label: 'ChatGPT / Codex (browser login)',
        hint: 'OAuth in browser — like before',
      },
    ],
  })
  if (isCancel(mode)) {
    cancel('Cancelled')
    process.exit(0)
  }

  if (mode === 'codex') {
    const model = await promptCodexSetup({ forceReauth: false })
    return { kind: 'codex', model }
  }

  const config = await promptOpenAiSetup({ forceReauth: false })
  return { kind: 'openai-api', config }
}
