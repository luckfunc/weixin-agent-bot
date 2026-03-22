import { spawn } from 'node:child_process'

/** Open a URL in the default browser. Set NO_OPEN_BROWSER=1 to skip. */
export function openUrlInBrowser(url: string): void {
  if (process.env.NO_OPEN_BROWSER === '1') return
  if (!/^https?:\/\//i.test(url)) return

  try {
    const platform = process.platform
    if (platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref()
    } else if (platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      }).unref()
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref()
    }
  } catch {
    /* ignore */
  }
}
