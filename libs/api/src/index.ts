import { getAPI } from "api-typify";
import { Services } from "./services";

export * from "./models";
export * from "./services";

export function createAPI(endpoint: string, headers?: Record<string, string>) {
  return getAPI<
    Services,
    {
      headers?: Record<string, string>;
      next?: {
        revalidate?: number | false;
        tags?: string[];
      };
    }
  >(endpoint, (url, options) =>
    fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...headers,
        ...options?.headers,
      },
      credentials: "include",
    }).then((res) => {
      if (res.ok) {
        return res.json();
      }
      return Promise.reject(res);
    })
  );
}

export const API = createAPI("http://localhost:5000/v1");

export default API;
