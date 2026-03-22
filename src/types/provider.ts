export type AuthKind = 'api_key' | 'oauth' | 'none'

export interface ProviderDef {
  id: string
  label: string
  hint: string
  authKind: AuthKind
  envKeys: string[]
  baseUrl?: string
  defaultModel: string
  models?: string[]
}

export interface ResolvedProvider {
  id: string
  label: string
  apiKey?: string
  baseUrl?: string
  model: string
}
