import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    ORY_ENDPOINT: z.string().url(),
    ORY_API_KEY: z.string().min(1),
  },
  runtimeEnv: process.env,
});
