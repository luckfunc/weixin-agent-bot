import chalk from 'chalk'
import { cancel, isCancel, note, select } from '@clack/prompts'
import type { LlmMode } from '../llm/types.js'
import { ensureCodexAuth } from './codex/oauth-flow.js'
import { loadCodexAuth } from './codex/store.js'

/** Clack interactive selection for model backend. */
export async function promptLlmBackend(): Promise<LlmMode> {
  const mode = await select({
    message: 'Select model backend',
    options: [
      { value: 'openai' as const, label: 'OpenAI API', hint: 'requires OPENAI_API_KEY' },
      { value: 'codex' as const, label: 'ChatGPT / Codex', hint: 'browser OAuth' },
    ],
  })

  if (isCancel(mode)) {
    cancel('Cancelled')
    process.exit(0)
  }

  return mode
}

/** Run auth for the chosen backend. */
export async function runLlmAuth(llmMode: LlmMode, opts: { recodex: boolean }): Promise<void> {
  if (llmMode === 'openai') {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      note(
        `${chalk.dim('Add to .env:')}\n${chalk.cyan('OPENAI_API_KEY=sk-...')}`,
        chalk.yellow('Missing OPENAI_API_KEY'),
      )
      cancel('Set the key and try again')
      process.exit(1)
    }
    note(chalk.dim('OPENAI_API_KEY found; skipping browser login.'), chalk.green('OpenAI'))
    return
  }

  const needsOAuth = opts.recodex || !loadCodexAuth()
  if (needsOAuth) {
    note(chalk.dim('Opening browser for OAuth; follow any terminal prompts.'), 'Codex sign-in')
  } else {
    note(chalk.dim('Codex credentials found.'), chalk.green('Codex'))
  }
  await ensureCodexAuth({ force: opts.recodex })
}
