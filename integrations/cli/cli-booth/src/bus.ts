export type Bus<T> = {
  queue: T[];
  delay: number;
  timer: NodeJS.Timeout | undefined;
  add: (message: T) => Promise<void>;
  process: (autoStart?: boolean) => Promise<void>;
  hurryAndWait: () => Promise<void>;
};

export function createBus<T>(options: {
  delay: number;
  batchSize: number;
  handler: (messages: T[]) => Promise<void>;
}): Bus<T> {
  return {
    queue: [] as T[],
    delay: options.delay,
    timer: undefined as NodeJS.Timeout | undefined,
    async add(message: T) {
      this.queue.push(message);

      if (!this.timer) {
        this.timer = setTimeout(() => this.process(true), this.delay);
      }
    },
    async process(autoStart?: boolean) {
      if (this.queue.length === 0) {
        return;
      }

      const messages = this.queue.splice(
        0,
        Math.min(this.queue.length, options.batchSize)
      );
      await options.handler(messages);

      if (!autoStart) return;

      if (this.queue.length === 0) {
        this.timer = undefined;
      } else {
        this.timer = setTimeout(() => this.process(true), this.delay);
      }
    },
    async hurryAndWait() {
      clearInterval(this.timer);

      if (this.queue.length === 0) {
        return;
      }

      return new Promise(async (resolve) => {
        while (this.queue.length > 0) {
          await this.process(false);
        }
        resolve();
      });
    },
  };
}
