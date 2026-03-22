import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const pExec = promisify(exec)

function intEnv(name: string, fallback: number): number {
  const v = process.env[name]?.trim()
  if (!v) return fallback
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/**
 * Runs a shell command on the host. Used when WEIXIN_DESKTOP_TOOLS=1.
 * SECURITY: equivalent to giving the LLM a shell on this machine.
 */
export async function runShellCommand(command: string): Promise<string> {
  const cwd = process.env.WEIXIN_TOOL_CWD?.trim() || process.cwd()
  const timeout = intEnv('WEIXIN_TOOL_TIMEOUT_MS', 120_000)
  const maxBuffer = intEnv('WEIXIN_TOOL_MAX_BUFFER', 500_000)
  const maxChars = intEnv('WEIXIN_TOOL_MAX_OUTPUT_CHARS', 24_000)

  try {
    const { stdout, stderr } = await pExec(command, {
      cwd,
      timeout,
      maxBuffer,
      windowsHide: true,
    })
    let out = (stdout ?? '') + (stderr ? `\nstderr:\n${stderr}` : '')
    if (out.length > maxChars) {
      out = `${out.slice(0, maxChars)}\n...[truncated to WEIXIN_TOOL_MAX_OUTPUT_CHARS]`
    }
    return out || '(no output)'
  } catch (err: unknown) {
    const e = err as {
      message?: string
      stdout?: string
      stderr?: string
      code?: string | number
    }
    const parts = [
      e.message ?? String(err),
      e.stdout ? `stdout:\n${e.stdout}` : '',
      e.stderr ? `stderr:\n${e.stderr}` : '',
      e.code !== undefined ? `code: ${e.code}` : '',
    ].filter(Boolean)
    return `Command failed:\n${parts.join('\n')}`
  }
}

export async function executeDesktopTool(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  if (name === 'run_shell') {
    const command =
      typeof args.command === 'string'
        ? args.command
        : String(args.command ?? '')
    if (!command.trim()) return 'Error: empty command'
    return runShellCommand(command)
  }
  return `Unknown tool: ${name}`
}
