import { Services } from "@pixeleye/api";
import { getAPI as getAPITypes } from "api-typify";
import { HeadersInit, fetch, Response, RequestInfo, RequestInit } from "undici";

export const fetchRetry = (
  url: RequestInfo,
  init?: RequestInit,
  retries = 3,
  retryWait = 3000
): Promise<Response> =>
  fetch(url, init).catch(async (err) => {
    if (retries <= 0) {
      throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, retryWait));
    return fetchRetry(url, init, retries - 1);
  });

interface APIOptions {
  headers?: HeadersInit;
  retries?: number;
  retryWait?: number;
}

function createAPI(endpoint: string, headers?: HeadersInit) {
  return getAPITypes<Services, APIOptions>(endpoint, (url, options) =>
    fetchRetry(
      url,
      {
        ...options,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...headers,
          ...options?.headers,
        },
      },
      options?.retries,
      options?.retryWait
    )
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        return Promise.reject(res);
      })
      .catch((err) => {
        if (err instanceof Response) {
          return err.json().then((json) => {
            throw new Error(JSON.stringify(json));
          });
        }
        throw err;
      })
  );
}

export type APIType = ReturnType<typeof createAPI>;

export function API({
  endpoint,
  token,
}: {
  endpoint: string;
  token: string;
}): APIType {
  return createAPI(endpoint, {
    Authorization: `Bearer ${token}`,
  });
}
