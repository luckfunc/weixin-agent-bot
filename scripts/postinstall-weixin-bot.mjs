#!/usr/bin/env node
/**
 * @pinixai/weixin-bot publishes TypeScript sources without prebuilt dist/.
 * Build it once after install so `exports` → dist/index.js resolves.
 */
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '..')
const pkgDir = path.join(root, 'node_modules', '@pinixai', 'weixin-bot')
const distIndex = path.join(pkgDir, 'dist', 'index.js')

if (!existsSync(path.join(pkgDir, 'package.json'))) {
  console.warn('[postinstall] @pinixai/weixin-bot not found, skip build')
  process.exit(0)
}

if (existsSync(distIndex)) {
  process.exit(0)
}

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: pkgDir, stdio: 'inherit', shell: process.platform === 'win32' })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

console.log('[postinstall] Building @pinixai/weixin-bot …')
run('npm', ['install', '--no-audit', '--no-fund'])
run('npm', ['run', 'build'])
