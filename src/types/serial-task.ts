export interface SerialTaskRunner {
  <T>(task: () => Promise<T>): Promise<T>
}
