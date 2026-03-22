import type { Tool } from '@mariozechner/pi-ai'
import { Type } from '@sinclair/typebox'
import type { ChatCompletionTool } from 'openai/resources/chat/completions'

const runShellDescription =
  'Run one shell command on the computer hosting this bot (same environment as the Node process). ' +
  'Use for listing directories, reading command output, git status, etc. ' +
  'On Windows, PowerShell/cmd syntax is fine. Combine commands with && or ; as appropriate.'

/** pi-ai / Codex tool definitions */
export const desktopToolsPi: Tool[] = [
  {
    name: 'run_shell',
    description: runShellDescription,
    parameters: Type.Object({
      command: Type.String({
        description: 'Single shell command line to execute',
      }),
    }),
  },
]

/** OpenAI-compatible chat completions tool definitions */
export const desktopToolsOpenAI: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'run_shell',
      description: runShellDescription,
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Single shell command line to execute',
          },
        },
        required: ['command'],
      },
    },
  },
]

export const desktopToolsSystemSuffix =
  '\n\nYou can run shell commands on the host via the run_shell tool when the user asks ' +
  'to inspect the machine, list files, run scripts, or use CLI utilities. ' +
  'Prefer short, read-only commands when possible; explain briefly what you run.'
