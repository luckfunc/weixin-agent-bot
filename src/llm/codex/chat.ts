import type {
  AssistantMessage,
  Message,
  TextContent,
  UserMessage,
} from '@mariozechner/pi-ai'
import { completeSimple, getModel } from '@mariozechner/pi-ai'
import type { OAuthCredentials } from '@mariozechner/pi-ai/oauth'
import { getOAuthApiKey } from '@mariozechner/pi-ai/oauth'
import { createSerialTaskRunner } from '../../lib/serial-task.js'
import { loadCodexAuth, saveCodexAuth } from './store.js'

function textFromAssistant(message: AssistantMessage): string {
  return message.content
    .filter((b): b is TextContent => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
}

function maxChatMessages(): number {
  const raw = process.env.CHAT_MAX_MESSAGES
  if (raw === undefined || raw === '') return 50
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 2) return 50
  return n
}

function trimHistory<T>(items: T[], max: number): void {
  if (items.length <= max) return
  items.splice(0, items.length - max)
}

const withCodexAuthLock = createSerialTaskRunner()

const conversationRunners = new Map<
  string,
  ReturnType<typeof createSerialTaskRunner>
>()

const codexHistories = new Map<string, Message[]>()

function getConversationRunner(conversationId: string) {
  let runner = conversationRunners.get(conversationId)
  if (!runner) {
    runner = createSerialTaskRunner()
    conversationRunners.set(conversationId, runner)
  }
  return runner
}

export async function replyWithCodexChat(
  modelId: string,
  opts: {
    conversationId: string
    systemPrompt: string
    userText: string
  },
): Promise<string> {
  const run = getConversationRunner(opts.conversationId)
  return run(async () =>
    withCodexAuthLock(async () => {
      let auth = loadCodexAuth()
      if (!auth) {
        throw new Error('No Codex credentials; run with --reauth to sign in')
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

      const history = codexHistories.get(opts.conversationId) ?? []
      const userMessage: UserMessage = {
        role: 'user',
        content: opts.userText,
        timestamp: Date.now(),
      }
      const messages: Message[] = [...history, userMessage]

      const model = getModel('openai-codex', modelId as never)
      const response = await completeSimple(
        model,
        {
          systemPrompt: opts.systemPrompt,
          messages,
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

      const next: Message[] = [...history, userMessage, response]
      trimHistory(next, maxChatMessages())
      codexHistories.set(opts.conversationId, next)

      return textFromAssistant(response)
    }),
  )
}
