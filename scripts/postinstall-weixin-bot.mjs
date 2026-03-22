#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
/**
 * @pinixai/weixin-bot publishes TypeScript sources without prebuilt dist/.
 * Build it once after install so `exports` → dist/index.js resolves.
 *
 * Resolves the install path by walking up from this package root — npm often hoists
 * @pinixai/weixin-bot to a sibling node_modules, so a fixed relative path is wrong.
 */
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = path.join(
  fileURLToPath(new URL('.', import.meta.url)),
  '..',
)

function findHoistedPackageDir(startDir, scope, pkgName) {
  let dir = path.resolve(startDir)
  for (let i = 0; i < 12; i++) {
    const candidate = path.join(
      dir,
      'node_modules',
      scope,
      pkgName,
      'package.json',
    )
    if (existsSync(candidate)) {
      return path.dirname(candidate)
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return undefined
}

const pkgDir = findHoistedPackageDir(packageRoot, '@pinixai', 'weixin-bot')
if (!pkgDir) {
  console.warn('[postinstall] @pinixai/weixin-bot not found, skip build')
  process.exit(0)
}

const distIndex = path.join(pkgDir, 'dist', 'index.js')
if (existsSync(distIndex)) {
  process.exit(0)
}

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, {
    cwd: pkgDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

console.log('[postinstall] Building @pinixai/weixin-bot …')
run('npm', ['install', '--no-audit', '--no-fund'])
run('npm', ['run', 'build'])
