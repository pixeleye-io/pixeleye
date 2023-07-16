import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const serverEnvs = {
  GITHUB_APP_ID: z.string(),
  GITHUB_PRIVATE_KEY: z.string(),
  GITHUB_APP_CLIENT_ID: z.string(),
  GITHUB_APP_CLIENT_SECRET: z.string(),
};

export const env = createEnv({
  server: {
    ...serverEnvs,
  },
  runtimeEnv: process.env,
});
