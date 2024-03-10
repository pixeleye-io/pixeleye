export type Bus<T> = {
  add: (message: T) => Promise<void>;
  hurryAndWait: () => Promise<void>;
};

export function createBus<T>(options: {
  delay: number;
  batchSize: number;
  handler: (messages: T[]) => Promise<void>;
}): Bus<T> {
  const queue: T[] = [];

  let timer: NodeJS.Timeout | undefined = undefined;

  let delay = options.delay;

  const process = async (autoStart?: boolean) => {
    if (queue.length === 0) {
      return;
    }

    const messages = queue.splice(0, Math.min(queue.length, options.batchSize));
    await options.handler(messages);

    if (!autoStart) return;

    if (queue.length === 0) {
      timer = undefined;
    } else {
      timer = setTimeout(() => process(true), delay);
    }
  };

  return {
    async add(message: T) {
      queue.push(message);

      if (!timer) {
        timer = setTimeout(() => process(true), delay);
      }
    },
    async hurryAndWait() {
      clearInterval(timer);

      if (queue.length === 0) {
        return;
      }

      return new Promise(async (resolve) => {
        while (queue.length > 0) {
          await process(false);
        }
        resolve();
      });
    },
  };
}
