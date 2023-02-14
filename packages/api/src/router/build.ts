import { z } from "zod";
import { createTRPCRouter, protectedProcedureProject } from "../trpc";

export const buildRouter = createTRPCRouter({
  createBuild: protectedProcedureProject
    .input(
      z.object({
        sha: z.string(),
        visualSnapshots: z.array(z.string()),
        domSnapshots: z.array(z.string()).optional(),
        partial: z.boolean().optional(),
        url: z.string().optional(),
        pullRequestTitle: z.string().optional(),
        commitMessage: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const projectId = ctx.projectId;
      const {
        sha,
        visualSnapshots,
        domSnapshots,
        partial,
        url,
        pullRequestTitle,
        commitMessage,
      } = input;
      const build = await ctx.prisma.build.upsert({
        where: {
          projectId_sha: {
            projectId,
            sha,
          },
        },
        update: {
          visualSnapshots: {
            connect: visualSnapshots.map((id) => ({ id })),
          },
          domSnapshots: {
            connect: domSnapshots?.map((id) => ({ id })),
          },
          url,
          commitMessage,
          pullRequestTitle,
        },
        create: {
          sha,
          projectId,
          url,
          commitMessage,
          pullRequestTitle,
          visualSnapshots: {
            connect: visualSnapshots.map((visId) => ({ id: visId })),
          },
          domSnapshots: {
            connect: domSnapshots?.map((domId) => ({ id: domId })),
          },
        },
      });

      if (partial) {
        // Kick off image comparisons for this build
      }
    }),
});
