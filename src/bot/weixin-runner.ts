import { WeixinBot, type IncomingMessage } from '@pinixai/weixin-bot'
import qrterm from 'qrcode-terminal'
import chalk from 'chalk'
import { spinner, log as clackLog } from '@clack/prompts'
import { replyText } from '../llm/reply.js'
import type { ResolvedProvider } from '../providers/types.js'

export interface WeixinBotOptions {
  provider: ResolvedProvider
  forceLogin: boolean
}

function ts(level: string, msg: string) {
  console.log(`${new Date().toISOString()} [${level}] ${msg}`)
}

export async function runWeixinBot(opts: WeixinBotOptions): Promise<void> {
  const { provider, forceLogin } = opts
  const systemPrompt =
    process.env.SYSTEM_PROMPT ?? 'You are a helpful assistant. Reply concisely in the same language as the user.'
  const tokenPath = process.env.WEIXIN_TOKEN_PATH

  // --- Login with spinner & inline QR ---
  const loginSpinner = spinner()
  loginSpinner.start(forceLogin ? 'Generating WeChat QR code...' : 'Connecting to WeChat...')
  let loginSpinnerStopped = false

  function stopLoginSpinner(message: string): void {
    if (loginSpinnerStopped) return
    loginSpinner.stop(message)
    loginSpinnerStopped = true
  }

  let qrShown = false
  const origStderrWrite = process.stderr.write.bind(process.stderr)
  process.stderr.write = ((chunk: unknown, ...args: unknown[]) => {
    const str = typeof chunk === 'string' ? chunk : String(chunk)
    if (str.startsWith('https://') && str.includes('qrcode=')) {
      if (!qrShown) {
        stopLoginSpinner('Scan this QR code with WeChat:')
        qrShown = true
      }
      qrterm.generate(str.trim(), { small: true }, (qr: string) => {
        console.log(qr)
      })
      return true
    }
    return origStderrWrite(chunk as Buffer, ...(args as []))
  }) as typeof process.stderr.write

  const bot = new WeixinBot({
    tokenPath,
    onError: (err: unknown) => {
      ts('ERROR', err instanceof Error ? err.stack ?? err.message : String(err))
    },
  })

  let creds: Awaited<ReturnType<WeixinBot['login']>>
  try {
    creds = await bot.login({ force: forceLogin })
  } catch (err) {
    if (qrShown) {
      clackLog.error('WeChat login failed')
    } else {
      stopLoginSpinner('WeChat login failed')
    }
    throw err
  } finally {
    process.stderr.write = origStderrWrite
  }

  if (qrShown) {
    clackLog.success(`WeChat connected — ${chalk.dim(creds.accountId)}`)
  } else {
    stopLoginSpinner(`WeChat connected — ${chalk.dim(creds.accountId)}`)
  }

  // --- Message handler ---
  bot.onMessage(async (msg: IncomingMessage) => {
    if (msg.type !== 'text' || !msg.text?.trim()) return

    const preview = msg.text.length > 200 ? msg.text.slice(0, 200) + '...' : msg.text
    ts('RECV', `${msg.userId}: ${preview}`)

    try { await bot.sendTyping(msg.userId) } catch { /* best-effort */ }

    try {
      const text = await replyText(provider, { systemPrompt, userText: msg.text })
      if (!text) {
        await bot.reply(msg, '(no model output)')
        return
      }
      await bot.reply(msg, text)
      ts('SEND', `Replied ${text.length} chars`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      ts('ERROR', message)
      try {
        await bot.reply(msg, `LLM error: ${message}`)
      } catch (replyErr) {
        ts('ERROR', replyErr instanceof Error ? replyErr.message : String(replyErr))
      }
    }
  })

  process.on('SIGINT', () => {
    clackLog.warn('Stopping...')
    bot.stop()
  })

  clackLog.info(
    `${chalk.cyan(provider.label)} / ${chalk.dim(provider.model)} — listening for messages ${chalk.dim('(Ctrl+C to stop)')}`,
  )

  await bot.run()
  ts('INFO', 'Bot stopped')
}
