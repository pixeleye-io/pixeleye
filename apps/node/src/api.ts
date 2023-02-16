import type { AppRouter } from "@pixeleye/api";
import { transformer } from "@pixeleye/api/transformer";
import {
  createTRPCProxyClient,
  httpBatchLink,
  inferRouterProxyClient,
} from "@trpc/client";
import nodeFetch from "node-fetch";

//${process.env.PIXELEYE_URL!}

export const api = createTRPCProxyClient<AppRouter>({
  transformer,
  links: [
    httpBatchLink({
      url: `http://localhost:3000/api/trpc`,
      fetch: nodeFetch as typeof fetch,
      headers: {
        Authorization: `Basic Y2xlNzF1NDZ2MDAwN3RnY3NtdmN3MTB1ZjowN2Q4MjhlYS04ZTYwLTQ1NTYtYjZhNi1iMGI2NWZjNjUzYTE=`,
      },
    }),
  ],
});

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterType = inferRouterProxyClient<AppRouter>;
