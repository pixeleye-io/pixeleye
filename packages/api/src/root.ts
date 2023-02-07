import { authRouter } from "./router/auth";
import { githubRouter } from "./router/github";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  github: githubRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
