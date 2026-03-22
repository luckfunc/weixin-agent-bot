import OpenAI from 'openai'
import type { FetchModelsOptions } from './types.js'

/**
 * Lists model IDs from an OpenAI-compatible `GET /v1/models`.
 * Returns [] on failure (caller falls back to manual input).
 */
export async function fetchOpenAiModelIds(
  opts: FetchModelsOptions,
): Promise<string[]> {
  try {
    const client = new OpenAI({
      apiKey: opts.apiKey,
      baseURL: opts.baseUrl,
      timeout: 8_000,
    })
    const list = await client.models.list()
    const ids: string[] = []
    for await (const model of list) {
      ids.push(model.id)
    }
    return ids.sort()
  } catch {
    return []
  }
}
