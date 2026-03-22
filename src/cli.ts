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

  WeChat + GPT (OpenAI API key or ChatGPT / Codex browser login).

  ${chalk.dim('Usage')}
    $ weixin-agent-bot [options]

  ${chalk.dim('Options')}
    --force-login   Force WeChat QR re-login (skip cached session)
    --reauth        Re-sign-in (pick API key vs browser OAuth again)
    --help, -h      Show this message
    --version, -v   Show version

  ${chalk.dim('Environment')}
    PROVIDER           openai | codex (optional; disambiguate when both are configured)
    OPENAI_API_KEY     OpenAI platform API key (sk-...)
    OPENAI_BASE_URL    Optional API base URL
    OPENAI_MODEL       Model id for API path
    CODEX_MODEL        Model id for Codex path
    MODEL              Fallback if *_MODEL unset (Codex: default gpt-5.2; API: gpt-4o-mini)
    SYSTEM_PROMPT      System message for the assistant
    CHAT_MAX_MESSAGES  Max user+assistant messages per WeChat user (default 50)
    CODEX_AUTH_PATH    Override path for Codex OAuth token file
    NO_OPEN_BROWSER=1  Do not open OAuth URL automatically
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
  if (llm.kind === 'codex') {
    clackLog.info(
      `Codex / ${chalk.dim(llm.model)} ${chalk.dim('(env, saved, or token file)')}`,
    )
    return
  }
  clackLog.info(
    `OpenAI API / ${chalk.dim(llm.config.model)} ${chalk.dim('(env or saved)')}`,
  )
}

function outroLlm(llm: LlmRuntime): string {
  if (llm.kind === 'codex') return `Codex / ${llm.model}`
  return `OpenAI API / ${llm.config.model}`
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
