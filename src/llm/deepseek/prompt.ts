import { cancel, isCancel, log, note, select, text } from '@clack/prompts'
import chalk from 'chalk'
import type { DeepSeekAuthProfile } from '@/types/index.js'
import { getActiveProfile, setActiveAuth } from '../../persistence.js'
import { CURATED_DEEPSEEK_MODELS, DEFAULT_DEEPSEEK_MODEL } from './constants.js'
import type { DeepSeekConfig, DeepSeekThinkingMode } from './types.js'

function modelFromEnv(): string | undefined {
  return (
    process.env.DEEPSEEK_MODEL?.trim() ?? process.env.MODEL?.trim() ?? undefined
  )
}

function thinkingFromEnv(): DeepSeekThinkingMode | undefined {
  const raw = process.env.DEEPSEEK_THINKING?.trim().toLowerCase()
  if (raw === 'enabled' || raw === 'disabled') return raw
  return undefined
}

function persistDeepSeek(cfg: DeepSeekConfig): void {
  const profile: DeepSeekAuthProfile = {
    provider: 'deepseek',
    apiKey: cfg.apiKey,
    baseUrl: cfg.baseUrl,
    model: cfg.model,
    thinking: cfg.thinking,
  }
  setActiveAuth(profile)
}

export async function promptDeepSeekSetup(opts?: {
  forceReauth?: boolean
}): Promise<DeepSeekConfig> {
  const force = opts?.forceReauth ?? false

  let apiKey = process.env.DEEPSEEK_API_KEY?.trim()
  if (!apiKey && !force) {
    const saved = getActiveProfile()
    if (saved?.provider === 'deepseek' && saved.apiKey?.trim()) {
      apiKey = saved.apiKey.trim()
    }
  }

  if (apiKey) {
    note(chalk.dim('API key found.'), chalk.green('DeepSeek'))
  } else {
    const answer = await text({
      message: 'Enter DeepSeek API key',
      placeholder: 'sk-...',
      validate: (v) =>
        v.trim().length === 0 ? 'Key cannot be empty' : undefined,
    })
    if (isCancel(answer)) {
      cancel('Cancelled')
      process.exit(0)
    }
    apiKey = answer.trim()
  }

  let baseUrl = process.env.DEEPSEEK_BASE_URL?.trim() || undefined
  if (!baseUrl && !force) {
    const saved = getActiveProfile()
    if (saved?.provider === 'deepseek' && saved.baseUrl?.trim()) {
      baseUrl = saved.baseUrl.trim()
    }
  }
  if (baseUrl) {
    note(chalk.dim(`Base URL: ${baseUrl}`), chalk.green('DeepSeek'))
  }

  let thinking = thinkingFromEnv()
  if (!thinking && !force) {
    const saved = getActiveProfile()
    if (saved?.provider === 'deepseek') thinking = saved.thinking
  }
  if (thinking) {
    log.info(`Thinking: ${chalk.cyan(thinking)} ${chalk.dim('(env or saved)')}`)
  }

  const envModel = modelFromEnv()
  if (envModel) {
    log.info(`Model: ${chalk.cyan(envModel)} ${chalk.dim('(env)')}`)
    const cfg: DeepSeekConfig = { apiKey, model: envModel, baseUrl, thinking }
    persistDeepSeek(cfg)
    return cfg
  }

  const model = await promptModelPicker()
  const cfg: DeepSeekConfig = { apiKey, model, baseUrl, thinking }
  persistDeepSeek(cfg)
  return cfg
}

async function promptModelPicker(): Promise<string> {
  const OTHER = '__other__'
  const options = [
    ...CURATED_DEEPSEEK_MODELS.map((m) => ({
      value: m,
      label: m,
      hint: m === DEFAULT_DEEPSEEK_MODEL ? 'default' : undefined,
    })),
    { value: OTHER, label: 'Other...', hint: 'enter manually' },
  ]

  const choice = await select({
    message: 'Select a DeepSeek model',
    initialValue: DEFAULT_DEEPSEEK_MODEL,
    options,
  })

  if (isCancel(choice)) {
    cancel('Cancelled')
    process.exit(0)
  }

  if (choice !== OTHER) return choice

  const answer = await text({
    message: 'Enter model name',
    placeholder: DEFAULT_DEEPSEEK_MODEL,
    defaultValue: DEFAULT_DEEPSEEK_MODEL,
  })

  if (isCancel(answer)) {
    cancel('Cancelled')
    process.exit(0)
  }

  return answer.trim() || DEFAULT_DEEPSEEK_MODEL
}
