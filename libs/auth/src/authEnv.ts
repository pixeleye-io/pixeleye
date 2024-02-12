import { z } from "zod";

export const authEnv = {
  server: {
    ORY_URL: z.string(),
  },
  client: {},
  experimental__runtimeEnv: {},
};
