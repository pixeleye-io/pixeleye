import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    ORY_URL: z.string().url(),
    ORY_ADMIN_URL: z.string().url(),
    ORY_API_KEY: z.string().optional(),
    BACKEND_URL: z.string().url(),
  },
  runtimeEnv: process.env,
});
