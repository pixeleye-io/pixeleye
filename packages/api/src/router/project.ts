/* eslint-disable no-case-declarations */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const projectRouter = createTRPCRouter({
  createUserProject: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.enum(["GITHUB", "GITLAB", "BITBUCKET", "OTHER"]),
        url: z.string().optional(),
        githubInstallId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      switch (input.type) {
        case "GITHUB":
          let source = await ctx.prisma.source.findUnique({
            where: {
              githubInstallId: input.githubInstallId,
            },
          });
          if (!source) {
            source = await ctx.prisma.source.create({
              data: {
                githubInstallId: input.githubInstallId,
                type: input.type,
                userId: ctx.session.user.id,
              },
            });
          }

          return ctx.prisma.project.create({
            data: {
              name: input.name,
              url: input.url,
              sourceId: source.id,
              userId: ctx.session.user.id,
            },
          });

        default:
          return;
      }
    }),
});
