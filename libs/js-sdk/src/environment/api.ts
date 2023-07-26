import { createAPI } from "@pixeleye/api";
import { Context } from "./getEnv";

export function getAPI(ctx: Context): ReturnType<typeof createAPI> {
  if (ctx.api) return ctx.api;

  return createAPI(ctx.endpoint);
}
