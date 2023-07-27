import { Services } from "@pixeleye/api";
import { getAPI as getAPITypes } from "api-typify";
import { Context } from "./getEnv";
import fetch, { HeadersInit } from "node-fetch";

export function CreateNodeAPI(endpoint: string, headers?: HeadersInit) {
  return getAPITypes<
    Services,
    {
      headers?: HeadersInit;
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

export function getAPI(ctx: Context): ReturnType<typeof CreateNodeAPI> {
  if (ctx.api) return ctx.api;

  const api = CreateNodeAPI(ctx.endpoint, {
    Authorization: `Bearer ${ctx.token}`,
  });

  ctx.api = api;

  return api;
}
