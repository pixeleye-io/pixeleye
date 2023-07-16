import { serverEnvs } from "@pixeleye/github";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    ...serverEnvs,
  },
  experimental__runtimeEnv: {},
});
