#!/usr/bin/env node
import 'dotenv/config'
import { createRequire } from 'node:module'
import { log as clackLog, intro, outro } from '@clack/prompts'
import chalk from 'chalk'
import type { ResolvedProvider } from '@/types/index.js'
import { promptProvider, resolveProviderFromEnv } from './auth/prompt.js'
import { runWeixinBot } from './bot/weixin-runner.js'

const require = createRequire(import.meta.url)
const pkg = require('../package.json') as { version: string }

const args = new Set(process.argv.slice(2))

if (args.has('--help') || args.has('-h')) {
  console.log(`
  ${chalk.bold('weixin-agent-bot')} v${pkg.version}

  Connect any LLM to WeChat in minutes.

  ${chalk.dim('Usage')}
    $ weixin-agent-bot [options]

  ${chalk.dim('Options')}
    --force-login   Force WeChat QR re-login (skip cached session)
    --reauth        Re-select and re-authenticate LLM provider
    --help, -h      Show this message
    --version, -v   Show version

  ${chalk.dim('Environment')}
    PROVIDER           Force a provider (openai, anthropic, gemini, codex, moonshot, ...)
    OPENAI_API_KEY     OpenAI key  (or any <PROVIDER>_API_KEY)
    CODEX_MODEL        Model when PROVIDER=codex (after OAuth; default gpt-5.2)
    MODEL              Override model for any provider
    SYSTEM_PROMPT      Custom system prompt
`)
  process.exit(0)
}

if (args.has('--version') || args.has('-v')) {
  console.log(pkg.version)
  process.exit(0)
}

const forceLogin = args.has('--force-login')
const reauth = args.has('--reauth')

async function main(): Promise<void> {
  intro(chalk.bgCyan(chalk.black(` weixin-agent-bot v${pkg.version} `)))

  let provider: ResolvedProvider

  const envProvider = resolveProviderFromEnv()
  if (envProvider && !reauth) {
    clackLog.info(
      `Provider: ${chalk.cyan(envProvider.label)} / ${chalk.dim(envProvider.model)} ${chalk.dim('(env)')}`,
    )
    provider = envProvider
  } else {
    provider = await promptProvider({ forceReauth: reauth })
  }

  outro(chalk.dim(`Provider: ${provider.label} / ${provider.model}`))

  await runWeixinBot({ provider, forceLogin })
}

main().catch((err) => {
  console.error(chalk.red(err instanceof Error ? err.message : String(err)))
  process.exit(1)
})
