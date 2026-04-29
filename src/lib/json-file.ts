import { existsSync, readFileSync } from 'node:fs'

export class InvalidConfigFileError extends Error {
  readonly filePath: string

  constructor(filePath: string, label: string, cause?: unknown) {
    super(
      `${label} at ${filePath} is not valid JSON. Fix or delete the file and try again.`,
      cause === undefined ? undefined : { cause },
    )
    this.name = 'InvalidConfigFileError'
    this.filePath = filePath
  }
}

export function readOptionalJsonFile<T>(
  filePath: string,
  label: string,
): T | undefined {
  if (!existsSync(filePath)) return undefined

  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as T
  } catch (error) {
    throw new InvalidConfigFileError(filePath, label, error)
  }
}
