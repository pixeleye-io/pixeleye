import { z } from "zod";
import { createTRPCRouter, protectedProcedureGithub } from "../trpc";

export const githubRouter = createTRPCRouter({
  getInstallations: protectedProcedureGithub
    .input(
      z
        .object({
          page: z.number().optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) => {
      return ctx.userOctokit
        .request("GET /user/installations", {
          page: input?.page,
        })
        .then((data) => data);
    }),
});
