import type { AppRouter } from "@pixeleye/api";
import { transformer } from "@pixeleye/api/transformer";
import {
  createTRPCProxyClient,
  httpBatchLink,
  inferRouterProxyClient,
} from "@trpc/client";

export const api = createTRPCProxyClient<AppRouter>({
  transformer,
  links: [
    httpBatchLink({
      url: `${process.env.PIXELEYE_URL!}/api/trpc`,
    }),
  ],
});

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterType = inferRouterProxyClient<AppRouter>;
