import { create } from "zustand";

interface KeyStore {
  keys: Record<string, string>;
  setKey: (id: string, key: string) => void;
}

export const useKeyStore = create<KeyStore>()((set) => ({
  keys: {},
  setKey: (id: string, key: string) =>
    set((state) => ({
      keys: {
        ...state.keys,
        [id]: `${id}:${key}`,
      },
    })),
}));
