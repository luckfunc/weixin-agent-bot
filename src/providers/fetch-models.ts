import OpenAI from 'openai'
import type { FetchModelsOptions } from '@/types/index.js'

export type { FetchModelsOptions } from '@/types/index.js'

/**
 * Fetch available model IDs from an OpenAI-compatible /v1/models endpoint.
 * Returns an empty array on failure (caller should fall back to manual input).
 */
export async function fetchModels(opts: FetchModelsOptions): Promise<string[]> {
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
