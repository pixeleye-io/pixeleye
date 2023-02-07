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
      return (
        ctx.userOctokit
          .request("GET /user/installations", {
            page: input?.page,
          })
          // .catch((err) => {
          //   console.log("err", err);
          //   return err;
          // })
          // .then((data) => {
          //   console.log("data", data);
          //   return data;
          // })
          .then(({ data }) => data.installations)
      );
    }),
  getRepositories: protectedProcedureGithub
    .input(
      z.object({
        installationId: z.number(),
        page: z.number().optional(),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.userOctokit
        .request("GET /user/installations/{installation_id}/repositories", {
          installation_id: input.installationId,
          page: input.page,
        })
        .then(({ data }) => data.repositories);
    }),
});
