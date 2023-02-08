/* eslint-disable no-case-declarations */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const projectRouter = createTRPCRouter({
  createUserProject: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.enum(["GITHUB", "GITLAB", "BITBUCKET", "OTHER"]),
        gitId: z.string(),
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
              gitId: input.gitId,
            },
          });

        default:
          return;
      }
    }),
  getUserProjects: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.project.findMany({
      where: {
        userId: ctx.session.user.id,
      },
    });
  }),
  getProject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findUnique({
        where: {
          id: input.id,
        },
      });
      if (project && project.userId === ctx.session.user.id) {
        return project;
      }
      const projectUsers = await ctx.prisma.userOnProject.findUnique({
        where: {
          projectId_userId: {
            projectId: input.id,
            userId: ctx.session.user.id,
          },
        },
      });
      if (projectUsers) {
        return project;
      }
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }),
});
