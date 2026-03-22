import OpenAI from 'openai'
import { completeSimple, getModel } from '@mariozechner/pi-ai'
import { getOAuthApiKey } from '@mariozechner/pi-ai/oauth'
import type { OAuthCredentials } from '@mariozechner/pi-ai/oauth'
import type { AssistantMessage, TextContent } from '@mariozechner/pi-ai'
import { loadCodexAuth, saveCodexAuth } from '../auth/codex/store.js'
import type { LlmMode } from './types.js'

function textFromAssistant(message: AssistantMessage): string {
  return message.content
    .filter((b): b is TextContent => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
}

let codexAuthChain: Promise<void> = Promise.resolve()

async function withCodexAuthLock<T>(fn: () => Promise<T>): Promise<T> {
  let result!: T
  const next = codexAuthChain.then(async () => {
    result = await fn()
  })
  codexAuthChain = next.then(() => {})
  await next
  return result
}

async function replyWithCodex(systemPrompt: string, userText: string, modelId: string): Promise<string> {
  return withCodexAuthLock(async () => {
    let auth = loadCodexAuth()
    if (!auth) {
      throw new Error('No Codex credentials; run: npm run codex:login')
    }
    const refreshed = await getOAuthApiKey(
      'openai-codex',
      auth as unknown as Record<string, OAuthCredentials>,
    )
    if (!refreshed) {
      throw new Error('Invalid Codex credentials')
    }
    auth = { 'openai-codex': { type: 'oauth', ...refreshed.newCredentials } }
    saveCodexAuth(auth)

    const model = getModel('openai-codex', modelId as never)
    const response = await completeSimple(
      model,
      {
        systemPrompt,
        messages: [{ role: 'user', content: userText, timestamp: Date.now() }],
      },
      {
        apiKey: refreshed.apiKey,
        transport: (process.env.CODEX_TRANSPORT as 'auto' | 'sse' | 'websocket' | undefined) ?? 'auto',
      },
    )
    return textFromAssistant(response)
  })
}

async function replyWithOpenAI(
  openai: OpenAI,
  model: string,
  systemPrompt: string,
  userText: string,
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText },
    ],
  })
  return completion.choices[0]?.message?.content?.trim() ?? ''
}

export type { LlmMode } from './types.js'

export async function replyText(
  mode: LlmMode,
  opts: {
    openai?: OpenAI
    openaiModel?: string
    codexModel?: string
    systemPrompt: string
    userText: string
  },
): Promise<string> {
  if (mode === 'openai') {
    if (!opts.openai || !opts.openaiModel) {
      throw new Error('openai mode requires OpenAI client and model name')
    }
    return replyWithOpenAI(opts.openai, opts.openaiModel, opts.systemPrompt, opts.userText)
  }
  const modelId = opts.codexModel ?? 'gpt-5.2'
  return replyWithCodex(opts.systemPrompt, opts.userText, modelId)
}
