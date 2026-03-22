export type SerialTaskRunner = <T>(task: () => Promise<T>) => Promise<T>
