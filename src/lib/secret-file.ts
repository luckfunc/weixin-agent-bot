import { chmodSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

function setModeBestEffort(targetPath: string, mode: number): void {
  try {
    chmodSync(targetPath, mode)
  } catch (error) {
    if (process.platform !== 'win32') {
      throw error
    }
  }
}

export function ensureSecretDirectory(filePath: string): void {
  const dirPath = path.dirname(filePath)
  mkdirSync(dirPath, { recursive: true, mode: 0o700 })
  setModeBestEffort(dirPath, 0o700)
}

export function writeSecretJson(filePath: string, data: unknown): void {
  ensureSecretDirectory(filePath)
  writeFileSync(filePath, JSON.stringify(data, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  })
  setModeBestEffort(filePath, 0o600)
}
