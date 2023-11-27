import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    GITHUB_APP_NAME: z.string(),
    PIXELEYE_HOSTING: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_SERVER_URL: z.string(),
    NEXT_PUBLIC_PIXELEYE_HOSTING: z.string().optional(),
    NEXT_PUBLIC_SERVER_ENDPOINT: z.string(),
  },
  experimental__runtimeEnv: {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    NEXT_PUBLIC_PIXELEYE_HOSTING: process.env.NEXT_PUBLIC_PIXELEYE_HOSTING,
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    NEXT_PUBLIC_SERVER_ENDPOINT: process.env.NEXT_PUBLIC_SERVER_ENDPOINT,
  },
});
