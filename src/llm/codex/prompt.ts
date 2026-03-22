import { cancel, isCancel, log, note, select, text } from '@clack/prompts'
import chalk from 'chalk'
import type { CodexAuthProfile } from '@/types/index.js'
import { setActiveAuth } from '../../persistence.js'
import { CURATED_CODEX_MODELS, DEFAULT_CODEX_MODEL } from './constants.js'
import { ensureCodexAuth } from './oauth-flow.js'

function modelFromEnv(): string | undefined {
  return (
    process.env.CODEX_MODEL?.trim() ?? process.env.MODEL?.trim() ?? undefined
  )
}

export async function promptCodexSetup(opts?: {
  forceReauth?: boolean
}): Promise<string> {
  const force = opts?.forceReauth ?? false
  note(
    chalk.dim('Browser OAuth — follow terminal prompts.'),
    force ? 'Codex re-auth' : 'Codex sign-in',
  )
  await ensureCodexAuth({ force })

  const envModel = modelFromEnv()
  if (envModel) {
    log.info(`Model: ${chalk.cyan(envModel)} ${chalk.dim('(env)')}`)
    persistCodexModel(envModel)
    return envModel
  }

  const OTHER = '__other__'
  const choice = await select({
    message: 'Select a model',
    initialValue: DEFAULT_CODEX_MODEL,
    options: [
      ...CURATED_CODEX_MODELS.map((m) => ({
        value: m,
        label: m,
        hint: m === DEFAULT_CODEX_MODEL ? 'default' : undefined,
      })),
      { value: OTHER, label: 'Other...', hint: 'enter manually' },
    ],
  })

  if (isCancel(choice)) {
    cancel('Cancelled')
    process.exit(0)
  }

  let model: string
  if (choice === OTHER) {
    const answer = await text({
      message: 'Enter model name',
      placeholder: DEFAULT_CODEX_MODEL,
      defaultValue: DEFAULT_CODEX_MODEL,
    })
    if (isCancel(answer)) {
      cancel('Cancelled')
      process.exit(0)
    }
    model = answer.trim() || DEFAULT_CODEX_MODEL
  } else {
    model = choice
  }

  persistCodexModel(model)
  return model
}

function persistCodexModel(model: string): void {
  const profile: CodexAuthProfile = { provider: 'codex', model }
  setActiveAuth(profile)
}
