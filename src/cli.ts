#!/usr/bin/env node
import 'dotenv/config'
import { createRequire } from 'node:module'
import chalk from 'chalk'
import { intro, outro, log as clackLog } from '@clack/prompts'
import { resolveFromEnv } from './auth/resolve.js'
import { promptLlmBackend, runLlmAuth } from './auth/prompt.js'
import { runWeixinBot } from './bot/weixin-runner.js'
import type { LlmMode } from './llm/types.js'

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
    --force-login   Force WeChat QR re-login
    --recodex       Force Codex OAuth re-authorization
    --help, -h      Show this message
    --version, -v   Show version
`)
  process.exit(0)
}

if (args.has('--version') || args.has('-v')) {
  console.log(pkg.version)
  process.exit(0)
}

const forceLogin = args.has('--force-login')
const recodex = args.has('--recodex')

async function main(): Promise<void> {
  intro(chalk.bgCyan(chalk.black(` weixin-agent-bot v${pkg.version} `)))

  // 1. Resolve model backend (env → auto, otherwise interactive)
  let llmMode: LlmMode
  const envMode = resolveFromEnv()

  if (envMode) {
    clackLog.info(`Model backend: ${chalk.cyan(envMode)} (from environment)`)
    llmMode = envMode
  } else {
    llmMode = await promptLlmBackend()
  }

  // 2. Authenticate
  await runLlmAuth(llmMode, { recodex })

  // 3. Start WeChat bot
  outro(chalk.dim('Starting WeChat bot...'))
  await runWeixinBot({ llmMode, forceLogin })
}

main().catch((err) => {
  console.error(chalk.red(err instanceof Error ? err.message : String(err)))
  process.exit(1)
})
