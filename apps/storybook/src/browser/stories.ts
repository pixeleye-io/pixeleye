interface API {
  store: () => {
    _configuring?: boolean;
  };
  storyStore: {
    cacheAllCSFFiles: () => Promise<void>;
    cachedCSFFiles?: Record<string, unknown>;
  };
  raw: () => { id: string; kind: string; name: string }[];
}

type SBWindow = typeof window & {
  __STORYBOOK_CLIENT_API__: API;
};

export async function getStoriesInternal() {
  const { __STORYBOOK_CLIENT_API__: api } = window as SBWindow;

  await api.storyStore.cacheAllCSFFiles();

  let maxWait = 10_000;
  while (
    (api.store && api.store()._configuring) ||
    (api.storyStore && !api.storyStore.cachedCSFFiles)
  ) {
    if (maxWait <= 0) {
      throw new Error("Timeout waiting for stories");
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    maxWait -= 100;
  }

  return api.raw();
}
