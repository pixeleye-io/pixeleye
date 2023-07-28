import { Services } from "@pixeleye/api";
import { getAPI as getAPITypes } from "api-typify";
import { HeadersInit } from "undici";

export interface Context {
  env: NodeJS.ProcessEnv; // TODO - add @t3-oss/env
  endpoint: string;
  token: string;
  api?: APIType;
}

function createAPI(endpoint: string, headers?: HeadersInit ) {
  return getAPITypes<
    Services,
    {
      headers?: HeadersInit ;
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
    }).then((res) => {
      if (res.ok) {
        return res.json();
      }
      return Promise.reject(res);
    })
  );
}

export type APIType = ReturnType<typeof createAPI>;

export function getAPI(ctx: Context): APIType {
  if (ctx.api) return ctx.api;

  const api = createAPI(ctx.endpoint, {
    Authorization: `Bearer ${ctx.token}`,
  });

  ctx.api = api;

  return api;
}
