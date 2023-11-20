import { Services } from "@pixeleye/api";
import { getAPI } from "api-typify";
import { redirect } from "next/navigation";

const endpoint = "http://localhost:5000/v1";

export interface CustomProps {
  headers?: Record<string, string>;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

export const createAPI = (extraHeaders: Record<string, string> = {}) =>
  getAPI<Services, CustomProps>(endpoint, (url, options) =>
    fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...extraHeaders,
        ...options?.headers,
      },
      credentials: "include",
    }).then((res) => {
      if (res.status === 300 && res.headers.get("pixeleye-location")) {
        if (typeof window !== "undefined") {
          window.location.href = res.headers.get("pixeleye-location")!;
        }
        redirect(res.headers.get("pixeleye-location")!);
      }

      if (res.ok) {
        return res.json().catch(() => undefined);
      }
      return Promise.reject(res);
    })
  );

export const API = createAPI();
