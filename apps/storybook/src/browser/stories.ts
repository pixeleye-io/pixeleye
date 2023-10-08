export interface RawStory {
  id: string;
  kind: string;
  name: string;
  story: string;
  args: Record<string, unknown>;
  componentId: string;
  title: string;
  component: Record<string, unknown>;
  tags: string[];
  parameters: Record<string, unknown>;
}

interface API {
  _storyStore?: {
    cacheAllCSFFiles: () => Promise<void>;
    cachedCSFFiles?: Record<string, unknown>;
    extract: () => RawStory[];
  };
}

export type SBWindow = typeof window & {
  __STORYBOOK_CLIENT_API__: API;
};
