import { isCancel, text } from '@clack/prompts'
import { loginOpenAICodex } from '@mariozechner/pi-ai/oauth'
import { codexAuthPath, loadCodexAuth, saveCodexAuth } from './store.js'
import { openUrlInBrowser } from '../../lib/open-url.js'

export async function ensureCodexAuth(options: { force?: boolean } = {}): Promise<void> {
  if (!options.force && loadCodexAuth()) {
    console.log(`[Codex] Credentials found, skipping browser login (${codexAuthPath()})`)
    console.log('[Codex] To sign in again, run the CLI with --reauth.\n')
    return
  }

  const credentials = await loginOpenAICodex({
    onAuth: ({ url, instructions }) => {
      openUrlInBrowser(url)
      console.log('Opening the auth page in your browser (or open this URL manually):\n' + url + '\n')
      if (instructions) console.log(instructions)
    },
    onPrompt: async (prompt) => {
      const answer = await text({
        message: prompt.message,
        placeholder: prompt.placeholder,
      })
      if (isCancel(answer)) {
        throw new Error('OAuth cancelled')
      }
      return answer
    },
    onProgress: (message) => console.log('[OAuth]', message),
  })

  saveCodexAuth({ 'openai-codex': { type: 'oauth', ...credentials } })
  console.log(`\n[Codex] Credentials saved: ${codexAuthPath()}\n`)
}
