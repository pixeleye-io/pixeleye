import { BACKEND_URL } from "@/env";
import { Services } from "@pixeleye/api";
import { getAPI } from "api-typify";
import { redirect } from "next/navigation";
import { create } from "zustand";

export interface CustomProps {
  headers?: Record<string, string>;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

export const useBackendURL = create<{
  backendURL?: string;
  setBackendURL: (url: string) => void;
}>((set) => ({
  setBackendURL: (url: string) => set({ backendURL: url }),
}));

export const createAPI = (extraHeaders: Record<string, string> = {}) => {
  const backendURL = useBackendURL.getState().backendURL || BACKEND_URL!;
  return getAPI<Services, CustomProps>(backendURL, (url, options) =>
    fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...extraHeaders,
        ...options?.headers,
      },
      credentials: "include",
    }).then(async (res) => {
      if (res.status === 300 && res.headers.get("pixeleye-location")) {
        if (typeof window !== "undefined") {
          window.location.href = res.headers.get("pixeleye-location")!;
        }
        redirect(res.headers.get("pixeleye-location")!);
      }

      if (res.ok) {
        return res.json().catch(() => undefined);
      }

      return Promise.reject(await res.json().catch(() => res));
    })
  );
};

export const API = createAPI();
