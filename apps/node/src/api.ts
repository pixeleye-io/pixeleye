import type { AppRouter } from "@pixeleye/api";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

export const api = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: process.env.PIXELEYE_URL!,
    }),
  ],
} as any);
