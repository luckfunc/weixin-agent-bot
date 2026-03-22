import type {
  AssistantMessage,
  Message,
  TextContent,
  ToolCall,
} from '@mariozechner/pi-ai'
import { completeSimple, getModel, validateToolCall } from '@mariozechner/pi-ai'
import type { OAuthCredentials } from '@mariozechner/pi-ai/oauth'
import { getOAuthApiKey } from '@mariozechner/pi-ai/oauth'
import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import type { ResolvedProvider } from '@/types/index.js'
import { loadCodexAuth, saveCodexAuth } from '../auth/codex/store.js'
import { createSerialTaskRunner } from '../lib/serial-task.js'
import { executeDesktopTool } from './tool-runtime.js'
import {
  desktopToolsOpenAI,
  desktopToolsPi,
  desktopToolsSystemSuffix,
} from './tools-def.js'

const MAX_AGENT_STEPS = 16

const withCodexAuthLock = createSerialTaskRunner()

function textFromAssistant(message: AssistantMessage): string {
  return message.content
    .filter((b): b is TextContent => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
}

function augmentSystemPrompt(base: string): string {
  return `${base}${desktopToolsSystemSuffix}`
}

async function replyWithCodexTools(
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
    const transport =
      (process.env.CODEX_TRANSPORT as
        | 'auto'
        | 'sse'
        | 'websocket'
        | undefined) ?? 'auto'

    const messages: Message[] = [
      { role: 'user', content: userText, timestamp: Date.now() },
    ]

    for (let step = 0; step < MAX_AGENT_STEPS; step++) {
      const response = await completeSimple(
        model,
        {
          systemPrompt: augmentSystemPrompt(systemPrompt),
          messages,
          tools: desktopToolsPi,
        },
        {
          apiKey: refreshed.apiKey,
          transport,
        },
      )

      messages.push(response)

      if (
        response.stopReason === 'error' ||
        response.stopReason === 'aborted'
      ) {
        throw new Error(response.errorMessage || 'LLM request failed')
      }

      if (response.stopReason === 'stop' || response.stopReason === 'length') {
        return textFromAssistant(response)
      }

      if (response.stopReason !== 'toolUse') {
        return textFromAssistant(response)
      }

      const toolCalls = response.content.filter(
        (b): b is ToolCall => b.type === 'toolCall',
      )
      for (const tc of toolCalls) {
        let output: string
        try {
          const validated = validateToolCall(desktopToolsPi, tc)
          output = await executeDesktopTool(
            tc.name,
            validated as Record<string, unknown>,
          )
        } catch (err) {
          output =
            err instanceof Error ? err.message : `Tool error: ${String(err)}`
        }
        messages.push({
          role: 'toolResult',
          toolCallId: tc.id,
          toolName: tc.name,
          content: [{ type: 'text', text: output }],
          isError: false,
          timestamp: Date.now(),
        })
      }
    }

    throw new Error('Desktop agent step limit exceeded (Codex)')
  })
}

async function replyWithOpenAICompatTools(
  provider: ResolvedProvider,
  systemPrompt: string,
  userText: string,
): Promise<string> {
  const client = new OpenAI({
    apiKey: provider.apiKey ?? 'no-key',
    baseURL: provider.baseUrl,
  })

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: augmentSystemPrompt(systemPrompt) },
    { role: 'user', content: userText },
  ]

  for (let step = 0; step < MAX_AGENT_STEPS; step++) {
    const completion = await client.chat.completions.create({
      model: provider.model,
      messages,
      tools: desktopToolsOpenAI,
      tool_choice: 'auto',
    })

    const choice = completion.choices[0]?.message
    if (!choice) return ''

    if (choice.tool_calls?.length) {
      messages.push(choice)
      for (const tc of choice.tool_calls) {
        if (tc.type !== 'function') continue
        let content: string
        try {
          const args = JSON.parse(tc.function.arguments || '{}') as Record<
            string,
            unknown
          >
          content = await executeDesktopTool(tc.function.name, args)
        } catch (err) {
          content =
            err instanceof Error ? err.message : `Tool error: ${String(err)}`
        }
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content,
        })
      }
      continue
    }

    const text = choice.content?.trim() ?? ''
    if (text) return text
    return '(no model output)'
  }

  throw new Error('Desktop agent step limit exceeded (OpenAI-compatible)')
}

/** Multi-turn tool loop: local shell execution + LLM. */
export async function replyWithDesktopTools(
  provider: ResolvedProvider,
  opts: { systemPrompt: string; userText: string },
): Promise<string> {
  if (provider.id === 'codex') {
    return replyWithCodexTools(opts.systemPrompt, opts.userText, provider.model)
  }
  return replyWithOpenAICompatTools(provider, opts.systemPrompt, opts.userText)
}
