import { BACKEND_URL } from "@/env";
import { Services } from "@pixeleye/api";
import { getAPI } from "api-typify";
import { redirect } from "next/navigation";

export interface CustomProps {
  headers?: Record<string, string>;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

export const createAPI = (extraHeaders: Record<string, string> = {}) =>
  getAPI<Services, CustomProps>(BACKEND_URL!, (url, options) =>
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

      const error = await res.json().catch(() => res);
      error.status = res.status;

      return Promise.reject(error);
    })
  );

export const API = createAPI();
