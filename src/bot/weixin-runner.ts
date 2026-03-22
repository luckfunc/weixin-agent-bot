import { WeixinBot, type IncomingMessage } from '../weixin-sdk/index.js'
import OpenAI from 'openai'
import qrterm from 'qrcode-terminal'
import { replyText } from '../llm/reply.js'
import type { LlmMode } from '../llm/types.js'

export interface WeixinBotOptions {
  llmMode: LlmMode
  forceLogin: boolean
}

function log(level: string, msg: string) {
  const ts = new Date().toISOString()
  console.log(`${ts} [${level}] ${msg}`)
}

export async function runWeixinBot(opts: WeixinBotOptions): Promise<void> {
  const { llmMode, forceLogin } = opts
  const systemPrompt =
    process.env.SYSTEM_PROMPT ?? 'You are a helpful assistant. Reply concisely in the same language as the user.'
  const openaiModel = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  const codexModel = process.env.CODEX_MODEL ?? 'gpt-5.2'
  const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : undefined
  const tokenPath = process.env.WEIXIN_TOKEN_PATH

  // Intercept QR URLs from the SDK and render them as ASCII in the terminal
  const origStderrWrite = process.stderr.write.bind(process.stderr)
  process.stderr.write = ((chunk: unknown, ...args: unknown[]) => {
    const str = typeof chunk === 'string' ? chunk : String(chunk)
    if (str.startsWith('https://') && str.includes('qrcode=')) {
      qrterm.generate(str.trim(), { small: true }, (qr: string) => {
        origStderrWrite(qr + '\n')
      })
    }
    return origStderrWrite(chunk as Buffer, ...(args as []))
  }) as typeof process.stderr.write

  const bot = new WeixinBot({
    tokenPath,
    onError: (err: unknown) => {
      log('ERROR', err instanceof Error ? err.stack ?? err.message : String(err))
    },
  })

  log('INFO', forceLogin ? 'Forcing fresh QR login...' : 'Logging in (existing credentials will be reused)...')
  const creds = await bot.login({ force: forceLogin })
  log('INFO', `WeChat connected — Bot ID: ${creds.accountId}`)

  bot.onMessage(async (msg: IncomingMessage) => {
    if (msg.type !== 'text' || !msg.text?.trim()) {
      log('SKIP', `Non-text or empty message (type=${msg.type})`)
      return
    }

    const preview = msg.text.length > 200 ? msg.text.slice(0, 200) + '...' : msg.text
    log('RECV', `${msg.userId}: ${preview}`)

    try { await bot.sendTyping(msg.userId) } catch { /* best-effort */ }

    try {
      const text = await replyText(llmMode, {
        openai, openaiModel, codexModel, systemPrompt,
        userText: msg.text,
      })
      if (!text) {
        await bot.reply(msg, '(no model output)')
        return
      }
      await bot.reply(msg, text)
      log('SEND', `Replied ${text.length} chars`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      log('ERROR', message)
      try {
        await bot.reply(msg, `LLM error: ${message}`)
      } catch (replyErr) {
        log('ERROR', replyErr instanceof Error ? replyErr.message : String(replyErr))
      }
    }
  })

  process.on('SIGINT', () => {
    log('INFO', 'SIGINT received, stopping...')
    bot.stop()
  })

  const modelLabel = llmMode === 'openai' ? `openai/${openaiModel}` : `codex/${codexModel}`
  log('INFO', `LLM: ${modelLabel} — listening for messages (Ctrl+C to stop)`)
  await bot.run()
  log('INFO', 'Bot stopped')
}
