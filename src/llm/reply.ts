import type { AssistantMessage, TextContent } from '@mariozechner/pi-ai'
import { completeSimple, getModel } from '@mariozechner/pi-ai'
import type { OAuthCredentials } from '@mariozechner/pi-ai/oauth'
import { getOAuthApiKey } from '@mariozechner/pi-ai/oauth'
import OpenAI from 'openai'
import type { ResolvedProvider } from '@/types/index.js'
import { loadCodexAuth, saveCodexAuth } from '../auth/codex/store.js'
import { createSerialTaskRunner } from '../lib/serial-task.js'

function textFromAssistant(message: AssistantMessage): string {
  return message.content
    .filter((b): b is TextContent => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
}

const withCodexAuthLock = createSerialTaskRunner()

async function replyWithCodex(
  systemPrompt: string,
  userText: string,
  modelId: string,
): Promise<string> {
  return withCodexAuthLock(async () => {
    let auth = loadCodexAuth()
    if (!auth) {
      throw new Error('No Codex credentials; run the CLI again to authenticate')
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
        transport:
          (process.env.CODEX_TRANSPORT as
            | 'auto'
            | 'sse'
            | 'websocket'
            | undefined) ?? 'auto',
      },
    )
    return textFromAssistant(response)
  })
}

async function replyWithOpenAICompat(
  provider: ResolvedProvider,
  systemPrompt: string,
  userText: string,
): Promise<string> {
  const client = new OpenAI({
    apiKey: provider.apiKey ?? 'no-key',
    baseURL: provider.baseUrl,
  })
  const completion = await client.chat.completions.create({
    model: provider.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText },
    ],
  })
  return completion.choices[0]?.message?.content?.trim() ?? ''
}

export async function replyText(
  provider: ResolvedProvider,
  opts: {
    systemPrompt: string
    userText: string
  },
): Promise<string> {
  if (provider.id === 'codex') {
    return replyWithCodex(opts.systemPrompt, opts.userText, provider.model)
  }
  return replyWithOpenAICompat(provider, opts.systemPrompt, opts.userText)
}
