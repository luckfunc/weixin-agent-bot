import chalk from 'chalk'
import { cancel, isCancel, log, note, select, spinner, text } from '@clack/prompts'
import { getAllProviders, getProvider } from '../providers/registry.js'
import { fetchModels } from '../providers/fetch-models.js'
import type { ProviderDef, ResolvedProvider } from '../providers/types.js'
import { getActiveProfile, setActiveProvider, type AuthProfile } from './store.js'
import { ensureCodexAuth } from './codex/oauth-flow.js'
import { loadCodexAuth } from './codex/store.js'

/**
 * Resolve provider from explicit env vars only (non-interactive).
 * Returns undefined when no env config is found.
 */
export function resolveProviderFromEnv(): ResolvedProvider | undefined {
  const explicit = process.env.PROVIDER
  if (explicit) {
    const def = getProvider(explicit)
    if (!def) return undefined
    return resolveProviderEnvAuth(def)
  }

  for (const def of getAllProviders()) {
    const resolved = resolveProviderEnvAuth(def)
    if (resolved) return resolved
  }

  return undefined
}

function resolveProviderEnvAuth(def: ProviderDef): ResolvedProvider | undefined {
  if (def.authKind === 'none' || def.authKind === 'oauth') return undefined
  for (const envKey of def.envKeys) {
    const val = process.env[envKey]?.trim()
    if (val) {
      const modelEnv = `${def.id.toUpperCase().replace(/-/g, '_')}_MODEL`
      return {
        id: def.id,
        label: def.label,
        apiKey: val,
        baseUrl: def.baseUrl,
        model: process.env[modelEnv] ?? def.defaultModel,
      }
    }
  }
  return undefined
}

function resolveFromSavedProfile(profile: AuthProfile): ResolvedProvider | undefined {
  const def = getProvider(profile.provider)
  if (!def) return undefined
  if (def.id === 'codex' && !loadCodexAuth()) return undefined
  return {
    id: def.id,
    label: def.label,
    apiKey: profile.apiKey,
    baseUrl: profile.baseUrl ?? def.baseUrl,
    model: profile.model ?? def.defaultModel,
  }
}

/**
 * Interactive provider selection.
 *
 * Single select list with the saved provider pre-selected (press Enter to reuse,
 * arrow keys to switch). When the user picks the saved provider, credentials are
 * reused without re-authentication. When `forceReauth` is set, auth runs even
 * for the saved provider.
 */
export async function promptProvider(opts?: { forceReauth?: boolean }): Promise<ResolvedProvider> {
  const saved = getActiveProfile()
  const forceReauth = opts?.forceReauth ?? false

  const providers = getAllProviders()

  const options = providers.map((p) => {
    const isCurrent = saved?.provider === p.id
    return {
      value: p.id,
      label: isCurrent ? `${p.label} ${chalk.dim(`(${saved!.model ?? p.defaultModel})`)}` : p.label,
      hint: isCurrent ? 'current' : p.hint,
    }
  })

  const providerId = await select({
    message: 'Select a provider',
    initialValue: saved?.provider,
    options,
  })

  if (isCancel(providerId)) {
    cancel('Cancelled')
    process.exit(0)
  }

  const def = getProvider(providerId)!

  if (!forceReauth && saved?.provider === providerId) {
    const resolved = resolveFromSavedProfile(saved)
    if (resolved) {
      log.success(`${chalk.cyan(resolved.label)} / ${chalk.dim(resolved.model)}`)
      return resolved
    }
  }

  return runProviderAuth(def)
}

export async function runProviderAuth(def: ProviderDef): Promise<ResolvedProvider> {
  if (def.authKind === 'none') return handleNoAuth(def)
  if (def.authKind === 'oauth') return handleOAuth(def)
  return handleApiKey(def)
}

async function handleNoAuth(def: ProviderDef): Promise<ResolvedProvider> {
  let baseUrl = def.baseUrl
  if (def.id === 'ollama') {
    const ollamaUrl = process.env.OLLAMA_BASE_URL?.trim()
    if (ollamaUrl) baseUrl = ollamaUrl
    note(chalk.dim(`Endpoint: ${baseUrl}\nNo authentication required.`), chalk.green(def.label))
  }

  const model = await promptModel(def, { apiKey: 'no-key', baseUrl })
  const resolved: ResolvedProvider = { id: def.id, label: def.label, baseUrl, model }
  setActiveProvider(def.id, { provider: def.id, baseUrl, model })
  return resolved
}

async function handleOAuth(def: ProviderDef): Promise<ResolvedProvider> {
  if (def.id === 'codex') {
    const hasAuth = loadCodexAuth()
    if (hasAuth) {
      note(chalk.dim('Codex credentials found.'), chalk.green(def.label))
    } else {
      note(chalk.dim('Opening browser for OAuth — follow any terminal prompts.'), `${def.label} sign-in`)
      await ensureCodexAuth({ force: false })
    }

    const model = await promptModel(def, {})
    setActiveProvider(def.id, { provider: def.id, model })
    return { id: def.id, label: def.label, model }
  }

  throw new Error(`OAuth not implemented for ${def.id}`)
}

async function handleApiKey(def: ProviderDef): Promise<ResolvedProvider> {
  let apiKey: string | undefined
  const saved = getActiveProfile()
  if (saved?.provider === def.id && saved.apiKey) {
    apiKey = saved.apiKey
  }

  if (!apiKey) {
    for (const envKey of def.envKeys) {
      apiKey = process.env[envKey]?.trim()
      if (apiKey) break
    }
  }

  if (apiKey) {
    note(chalk.dim('API key found.'), chalk.green(def.label))
  } else {
    const envHint = def.envKeys[0]
    const answer = await text({
      message: `Enter API key for ${def.label}`,
      placeholder: `${envHint}=sk-...`,
      validate: (v) => (v.trim().length === 0 ? 'Key cannot be empty' : undefined),
    })

    if (isCancel(answer)) {
      cancel('Cancelled')
      process.exit(0)
    }

    apiKey = answer.trim()
  }

  let baseUrl = def.baseUrl
  if (def.id === 'openai-compat') {
    const existingUrl = process.env.OPENAI_COMPAT_BASE_URL?.trim() ?? saved?.baseUrl
    if (existingUrl) {
      baseUrl = existingUrl
      note(chalk.dim(`Endpoint: ${baseUrl}`), chalk.green(def.label))
    } else {
      const urlAnswer = await text({
        message: `Enter base URL for ${def.label}`,
        placeholder: 'http://localhost:8000/v1/',
        validate: (v) => (v.trim().length === 0 ? 'URL cannot be empty' : undefined),
      })
      if (isCancel(urlAnswer)) {
        cancel('Cancelled')
        process.exit(0)
      }
      baseUrl = urlAnswer.trim()
    }
  }

  const model = await promptModel(def, { apiKey, baseUrl })
  setActiveProvider(def.id, { provider: def.id, apiKey, baseUrl, model })
  return { id: def.id, label: def.label, apiKey, baseUrl, model }
}

interface PromptModelAuth {
  apiKey?: string
  baseUrl?: string
}

async function promptModel(def: ProviderDef, auth: PromptModelAuth): Promise<string> {
  const envKey = `${def.id.toUpperCase().replace(/-/g, '_')}_MODEL`
  const envModel = process.env[envKey]?.trim() ?? process.env.MODEL?.trim()
  if (envModel) {
    log.info(`Model: ${chalk.cyan(envModel)} ${chalk.dim('(env)')}`)
    return envModel
  }

  const curated = def.models ?? []

  let fetched: string[] = []
  if (auth.apiKey && auth.baseUrl) {
    const s = spinner()
    s.start('Fetching available models...')
    fetched = await fetchModels({ apiKey: auth.apiKey, baseUrl: auth.baseUrl })
    s.stop(fetched.length > 0 ? `Found ${fetched.length} models` : 'Using default model list')
  }

  const curatedSet = new Set(curated)
  const extra = fetched.filter((m) => !curatedSet.has(m)).slice(0, 15)
  const all = [...curated, ...extra]

  if (all.length > 0) {
    const OTHER = '__other__'
    const options = [
      ...all.map((m) => ({
        value: m,
        label: m,
        hint: m === def.defaultModel ? 'default' : undefined,
      })),
      { value: OTHER, label: 'Other...', hint: 'enter manually' },
    ]

    const choice = await select({
      message: 'Select a model',
      initialValue: all.includes(def.defaultModel) ? def.defaultModel : undefined,
      options,
    })

    if (isCancel(choice)) {
      cancel('Cancelled')
      process.exit(0)
    }

    if (choice !== OTHER) return choice
  }

  const answer = await text({
    message: 'Enter model name',
    placeholder: def.defaultModel,
    defaultValue: def.defaultModel,
  })

  if (isCancel(answer)) {
    cancel('Cancelled')
    process.exit(0)
  }

  return answer.trim() || def.defaultModel
}
