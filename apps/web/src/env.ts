import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    GITHUB_APP_NAME: z.string().optional(),
    BACKEND_URL: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_BACKEND_URL: z.string().optional(),
    NEXT_PUBLIC_PIXELEYE_HOSTING: z.string().optional(),
  },
  experimental__runtimeEnv: {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    NEXT_PUBLIC_PIXELEYE_HOSTING: process.env.NEXT_PUBLIC_PIXELEYE_HOSTING,
  },
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});

// If we're on the client, we can use the NEXT_PUBLIC_ environment variables
// This is a bit of a hack for docker-compose, since we want our server-side code to access our backend via the docker network
export const BACKEND_URL =
  (typeof window !== "undefined"
    ? env.NEXT_PUBLIC_BACKEND_URL
    : env.BACKEND_URL) || env.NEXT_PUBLIC_BACKEND_URL;
