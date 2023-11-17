import { Services } from "@pixeleye/api";
import { getAPI } from "api-typify";

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
      if (res.ok) {
        return res.json().catch(() => undefined);
      }
      return Promise.reject(res);
    })
  );

export const API = createAPI();
