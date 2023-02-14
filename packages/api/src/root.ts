import { authRouter } from "./router/auth";
import { githubRouter } from "./router/github";
import { projectRouter } from "./router/project";
import { snapshotRouter } from "./router/snapshot";
import { teamRouter } from "./router/team";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  github: githubRouter,
  project: projectRouter,
  team: teamRouter,
  snapshot: snapshotRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
