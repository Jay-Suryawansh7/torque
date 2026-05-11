declare module "better-queue" {
  interface QueueOptions<T, R> {
    concurrent?: number;
    maxRetries?: number;
    retryDelay?: number;
  }
  type ProcessFn<T, R> = (input: T, cb: (err?: any, result?: R) => void) => void;
  class Queue<T = any, R = any> {
    constructor(process: ProcessFn<T, R>, options?: QueueOptions<T, R>);
    push(input: T, cb?: (err?: any, result?: R) => void): void;
    pause(): void;
    resume(): void;
    destroy(): void;
  }
  export = Queue;
}
