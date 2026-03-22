import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions.js'
import { createSerialTaskRunner } from '../../lib/serial-task.js'
import type { OpenAiConfig } from './types.js'

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

const conversationRunners = new Map<
  string,
  ReturnType<typeof createSerialTaskRunner>
>()

const histories = new Map<string, ChatCompletionMessageParam[]>()

function getConversationRunner(conversationId: string) {
  let runner = conversationRunners.get(conversationId)
  if (!runner) {
    runner = createSerialTaskRunner()
    conversationRunners.set(conversationId, runner)
  }
  return runner
}

export async function replyWithOpenAiChat(
  config: OpenAiConfig,
  opts: {
    conversationId: string
    systemPrompt: string
    userText: string
  },
): Promise<string> {
  const run = getConversationRunner(opts.conversationId)
  return run(async () => {
    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    })
    const history = histories.get(opts.conversationId) ?? []
    const userMessage: ChatCompletionMessageParam = {
      role: 'user',
      content: opts.userText,
    }
    const completion = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: opts.systemPrompt },
        ...history,
        userMessage,
      ],
    })
    const m = completion.choices[0]?.message
    const replyParts: string[] = []
    if (m?.content?.trim()) replyParts.push(m.content.trim())
    if (m?.refusal?.trim()) replyParts.push(m.refusal.trim())
    const reply = replyParts.join('\n').trim()

    const assistantMessage: ChatCompletionMessageParam = {
      role: 'assistant',
      content: reply.length > 0 ? reply : null,
    }
    const next: ChatCompletionMessageParam[] = [
      ...history,
      userMessage,
      assistantMessage,
    ]
    trimHistory(next, maxChatMessages())
    histories.set(opts.conversationId, next)

    return reply
  })
}
