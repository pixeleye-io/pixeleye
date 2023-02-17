import type { AppRouter } from "@pixeleye/api";
import { transformer } from "@pixeleye/api/transformer";
import {
  createTRPCProxyClient,
  httpBatchLink,
  inferRouterProxyClient,
} from "@trpc/client";
import nodeFetch from "node-fetch";

//${process.env.PIXELEYE_URL!}

export const api = (url: string, credentials: string) =>
  createTRPCProxyClient<AppRouter>({
    transformer,
    links: [
      httpBatchLink({
        url: `${url}/api/trpc`,
        fetch: nodeFetch as typeof fetch,
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      }),
    ],
  });

export type Test = ReturnType<typeof api>;

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterType = inferRouterProxyClient<AppRouter>;
