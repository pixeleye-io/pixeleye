import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  protectedProcedureProject,
} from "../trpc";

export const buildRouter = createTRPCRouter({
  createBuild: protectedProcedureProject
    .input(
      z.object({
        sha: z.string(),
        visualSnapshots: z.array(z.string()),
        domSnapshots: z.array(z.string()).optional(),
        partial: z.boolean().optional(),
        url: z.string().optional(),
        author: z.string().optional(),
        pullRequestTitle: z.string().optional(),
        commitMessage: z.string(),
        branch: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.projectId;
      const {
        sha,
        visualSnapshots,
        author,
        domSnapshots,
        partial,
        url,
        pullRequestTitle,
        commitMessage,
        branch,
      } = input;

      const build = await ctx.prisma.build.upsert({
        where: {
          projectId_sha: {
            projectId,
            sha,
          },
        },
        update: {
          commitMessage,
          pullRequestTitle,
          url,
          branch,
          author,
        },
        create: {
          branch,
          sha,
          commitMessage,
          pullRequestTitle,
          url,
          author,
          Snapshots: {
            connect: visualSnapshots.map((id) => ({
              id,
            })),
          },
          Project: {
            connect: {
              id: projectId,
            },
          },
        },
      });

      if (!partial) {
        // TODO - kick off build
      }
    }),
  getWithSnapshots: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const userId = ctx.session.user.id;
      const build = await ctx.prisma.build.findUnique({
        where: {
          id,
        },
        include: {
          Project: {
            select: {
              users: {
                where: {
                  userId,
                },
              },
            },
          },
          Snapshots: {
            select: {
              id: true,
              name: true,
              variant: true,
              visualSnapshots: {
                select: {
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!build) throw new TRPCError({ code: "NOT_FOUND" });

      if (build.Project.users.length === 0)
        throw new TRPCError({ code: "UNAUTHORIZED" });

      return {
        ...build,
        Project: undefined,
      };
    }),

  getWithProject: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const userId = ctx.session.user.id;
      const build = await ctx.prisma.build.findUnique({
        where: {
          id,
        },
        include: {
          Project: {
            select: {
              users: {
                where: {
                  userId,
                },
              },
              id: true,
              name: true,
              url: true,
              teamId: true,
              gitId: true,
              sourceId: true,
            },
          },
        },
      });

      if (!build) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (build.Project.users.length === 0) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return {
        ...build,
        Project: {
          ...build.Project,
          users: undefined,
        },
      };
    }),
});
