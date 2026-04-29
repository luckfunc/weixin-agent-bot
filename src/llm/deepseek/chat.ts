import {
  createDeepSeek,
  type DeepSeekLanguageModelOptions,
} from '@ai-sdk/deepseek'
import { generateText, type ModelMessage } from 'ai'
import { createSerialTaskRunner } from '../../lib/serial-task.js'
import type { DeepSeekConfig } from './types.js'

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

const histories = new Map<string, ModelMessage[]>()

function getConversationRunner(conversationId: string) {
  let runner = conversationRunners.get(conversationId)
  if (!runner) {
    runner = createSerialTaskRunner()
    conversationRunners.set(conversationId, runner)
  }
  return runner
}

function providerOptionsFor(
  config: DeepSeekConfig,
): { deepseek: DeepSeekLanguageModelOptions } | undefined {
  if (!config.thinking) return undefined
  return {
    deepseek: {
      thinking: { type: config.thinking },
    },
  }
}

export async function replyWithDeepSeekChat(
  config: DeepSeekConfig,
  opts: {
    conversationId: string
    systemPrompt: string
    userText: string
  },
): Promise<string> {
  const run = getConversationRunner(opts.conversationId)
  return run(async () => {
    const provider = createDeepSeek({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    })
    const history = histories.get(opts.conversationId) ?? []
    const userMessage: ModelMessage = {
      role: 'user',
      content: opts.userText,
    }

    const result = await generateText({
      model: provider(config.model),
      system: opts.systemPrompt,
      messages: [...history, userMessage],
      providerOptions: providerOptionsFor(config),
    })
    const reply = result.text.trim()

    const assistantMessage: ModelMessage = {
      role: 'assistant',
      content: reply,
    }
    const next: ModelMessage[] = [...history, userMessage, assistantMessage]
    trimHistory(next, maxChatMessages())
    histories.set(opts.conversationId, next)

    return reply
  })
}
