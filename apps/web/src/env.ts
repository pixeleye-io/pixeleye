import { serverEnvs } from "@pixeleye/github";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    GITHUB_APP_NAME: serverEnvs.GITHUB_APP_NAME,
  },
  client: {
    NEXT_PUBLIC_SERVER_URL: z.string(),
  },
  experimental__runtimeEnv: {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
  },
});
