import type { SerialTaskRunner } from '@/types/index.js'

export function createSerialTaskRunner(): SerialTaskRunner {
  let chain = Promise.resolve<void>(undefined)

  return async function runSerialTask<T>(task: () => Promise<T>): Promise<T> {
    const current = chain.catch(() => undefined).then(task)
    chain = current.then(
      () => undefined,
      () => undefined,
    )
    return current
  }
}
