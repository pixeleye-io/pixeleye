import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    GITHUB_APP_NAME: z.string(),
    ORY_URL: z.string(),
  },
  client: {
    NEXT_PUBLIC_BACKEND_URL: z.string(),
    NEXT_PUBLIC_PIXELEYE_HOSTING: z.string().optional(),
  },
  experimental__runtimeEnv: {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    NEXT_PUBLIC_PIXELEYE_HOSTING: process.env.NEXT_PUBLIC_PIXELEYE_HOSTING,
  },
});
