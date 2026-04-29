#!/usr/bin/env node
import 'dotenv/config'
import { createRequire } from 'node:module'
import { log as clackLog, intro, outro } from '@clack/prompts'
import chalk from 'chalk'
import type { LlmRuntime } from '@/types/index.js'
import { promptLlmRuntime, tryResolveLlmRuntime } from './llm/index.js'
import { runWeixinBot } from './wechat/bot.js'

const require = createRequire(import.meta.url)
const pkg = require('../package.json') as { version: string }

const args = new Set(process.argv.slice(2))

if (args.has('--help') || args.has('-h')) {
  console.log(`
  ${chalk.bold('weixin-agent-bot')} v${pkg.version}

  WeChat + DeepSeek CLI.

  ${chalk.dim('Usage')}
    $ weixin-agent-bot [options]

  ${chalk.dim('Options')}
    --force-login   Force WeChat QR re-login (skip cached session)
    --reauth        Re-enter DeepSeek API key / model settings
    --help, -h      Show this message
    --version, -v   Show version

  ${chalk.dim('Environment')}
    PROVIDER           deepseek (optional; other providers are no longer supported)
    DEEPSEEK_API_KEY   DeepSeek API key (sk-...)
    DEEPSEEK_BASE_URL  Optional API base URL (default: https://api.deepseek.com)
    DEEPSEEK_MODEL     Model id (default: deepseek-v4-flash)
    DEEPSEEK_THINKING  enabled | disabled (optional)
    MODEL              Fallback if DEEPSEEK_MODEL is unset
    SYSTEM_PROMPT      System message for the assistant
    CHAT_MAX_MESSAGES  Max user+assistant messages per WeChat user (default 50)
`)
  process.exit(0)
}

if (args.has('--version') || args.has('-v')) {
  console.log(pkg.version)
  process.exit(0)
}

const forceLogin = args.has('--force-login')
const reauth = args.has('--reauth')

function logResolvedLlm(llm: LlmRuntime): void {
  clackLog.info(
    `DeepSeek / ${chalk.dim(llm.config.model)} ${chalk.dim('(env or saved)')}`,
  )
}

function outroLlm(llm: LlmRuntime): string {
  return `DeepSeek / ${llm.config.model}`
}

async function main(): Promise<void> {
  intro(chalk.bgCyan(chalk.black(` weixin-agent-bot v${pkg.version} `)))

  let llm: LlmRuntime
  if (reauth) {
    llm = await promptLlmRuntime({ forceReauth: true })
  } else {
    const resolved = tryResolveLlmRuntime()
    if (resolved) {
      logResolvedLlm(resolved)
      llm = resolved
    } else {
      llm = await promptLlmRuntime()
    }
  }

  outro(chalk.dim(outroLlm(llm)))

  await runWeixinBot({ llm, forceLogin })
}

main().catch((err) => {
  console.error(chalk.red(err instanceof Error ? err.message : String(err)))
  process.exit(1)
})
