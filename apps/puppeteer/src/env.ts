import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    PX_BOOTH_PORT: z.number().optional(),
    // PX_VIEWPORTS: z.string().array().optional(),
    // PX_BROWSERS: z.string().array().optional(),
  },
  runtimeEnv: process.env,
});
