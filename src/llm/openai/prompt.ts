import {
  cancel,
  isCancel,
  log,
  note,
  select,
  spinner,
  text,
} from '@clack/prompts'
import chalk from 'chalk'
import type { OpenAiAuthProfile } from '@/types/index.js'
import { getActiveProfile, setActiveAuth } from '../../persistence.js'
import { CURATED_OPENAI_MODELS, DEFAULT_OPENAI_MODEL } from './constants.js'
import { fetchOpenAiModelIds } from './fetch-models.js'
import type { OpenAiConfig } from './types.js'

function modelFromEnv(): string | undefined {
  return (
    process.env.OPENAI_MODEL?.trim() ?? process.env.MODEL?.trim() ?? undefined
  )
}

function persistOpenAi(cfg: OpenAiConfig): void {
  const profile: OpenAiAuthProfile = {
    provider: 'openai',
    apiKey: cfg.apiKey,
    baseUrl: cfg.baseUrl,
    model: cfg.model,
  }
  setActiveAuth(profile)
}

export async function promptOpenAiSetup(opts?: {
  forceReauth?: boolean
}): Promise<OpenAiConfig> {
  const force = opts?.forceReauth ?? false

  let apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey && !force) {
    const saved = getActiveProfile()
    if (saved?.provider === 'openai' && saved.apiKey?.trim()) {
      apiKey = saved.apiKey.trim()
    }
  }

  if (apiKey) {
    note(chalk.dim('API key found.'), chalk.green('OpenAI'))
  } else {
    const answer = await text({
      message: 'Enter OpenAI API key',
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

  let baseUrl = process.env.OPENAI_BASE_URL?.trim() || undefined
  if (!baseUrl && !force) {
    const saved = getActiveProfile()
    if (saved?.provider === 'openai' && saved.baseUrl?.trim()) {
      baseUrl = saved.baseUrl.trim()
    }
  }
  if (baseUrl) {
    note(chalk.dim(`Base URL: ${baseUrl}`), chalk.green('OpenAI'))
  }

  const envModel = modelFromEnv()
  if (envModel) {
    log.info(`Model: ${chalk.cyan(envModel)} ${chalk.dim('(env)')}`)
    const cfg: OpenAiConfig = { apiKey, model: envModel, baseUrl }
    persistOpenAi(cfg)
    return cfg
  }

  const model = await promptModelPicker(apiKey, baseUrl)
  const cfg: OpenAiConfig = { apiKey, model, baseUrl }
  persistOpenAi(cfg)
  return cfg
}

async function promptModelPicker(
  apiKey: string,
  baseUrl: string | undefined,
): Promise<string> {
  const s = spinner()
  s.start('Fetching available models...')
  const fetched = await fetchOpenAiModelIds({ apiKey, baseUrl })
  s.stop(
    fetched.length > 0
      ? `Found ${fetched.length} models`
      : 'Using default model list',
  )

  const curatedSet = new Set(CURATED_OPENAI_MODELS)
  const extra = fetched.filter((m) => !curatedSet.has(m)).slice(0, 15)
  const all = [...CURATED_OPENAI_MODELS, ...extra]

  const OTHER = '__other__'
  const options = [
    ...all.map((m) => ({
      value: m,
      label: m,
      hint: m === DEFAULT_OPENAI_MODEL ? 'default' : undefined,
    })),
    { value: OTHER, label: 'Other...', hint: 'enter manually' },
  ]

  const choice = await select({
    message: 'Select a model',
    initialValue: all.includes(DEFAULT_OPENAI_MODEL)
      ? DEFAULT_OPENAI_MODEL
      : undefined,
    options,
  })

  if (isCancel(choice)) {
    cancel('Cancelled')
    process.exit(0)
  }

  if (choice !== OTHER) return choice

  const answer = await text({
    message: 'Enter model name',
    placeholder: DEFAULT_OPENAI_MODEL,
    defaultValue: DEFAULT_OPENAI_MODEL,
  })

  if (isCancel(answer)) {
    cancel('Cancelled')
    process.exit(0)
  }

  return answer.trim() || DEFAULT_OPENAI_MODEL
}
