import crypto from "crypto";
import { PrismaClient } from "@pixeleye/db";
import { TRPCError } from "@trpc/server";
import bycrypot from "bcryptjs";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const createProjectInput = z.object({
  name: z.string(),
  type: z.enum(["GITHUB", "GITLAB", "BITBUCKET", "OTHER"]),
  url: z.string().optional(),
  teamId: z.string().optional(),
  github: z
    .object({
      gitId: z.string(),
      installId: z.number(),
    })
    .optional(),
});

async function createGithubProject(
  prisma: PrismaClient,
  userId: string,
  input: z.infer<typeof createProjectInput>,
) {
  const rawSecret = crypto.randomUUID();
  const secret = bycrypot.hashSync(rawSecret);
  const project = await prisma.project.create({
    data: {
      name: input.name,
      url: input.url,
      secret,
      source: {
        connectOrCreate: {
          where: {
            githubInstallId: input.github!.installId,
          },
          create: {
            githubInstallId: input.github!.installId,
            type: input.type,
            userId,
          },
        },
      },
      Team: {
        connect: {
          id: input.teamId,
        },
      },
      gitId: input.github!.gitId,
      users: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
  });

  return {
    secret: rawSecret,
    key: project.key,
    id: project.id,
  };
}

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(createProjectInput)
    .mutation(async ({ ctx, input }) => {
      if (!input.teamId) {
        input.teamId = await ctx.prisma.userOnTeam
          .findFirst({
            where: {
              userId: ctx.session.user.id,
              team: {
                type: "USER",
              },
            },
            include: {
              team: true,
            },
          })
          .then((u) => u?.teamId);
      }
      switch (input.type) {
        case "GITHUB":
          return createGithubProject(ctx.prisma, ctx.session.user.id, input);
        default:
          return;
      }
    }),
  getTeamProjects: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.userOnProject
        .findMany({
          where: {
            userId: ctx.session.user.id,
            project: {
              teamId: input.teamId,
            },
          },
          include: {
            project: true,
          },
        })
        .then((projects) => projects.map((p) => p.project));
    }),
  getBuilds: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userOnPoject = await ctx.prisma.userOnProject.findUnique({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!userOnPoject) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const builds = await ctx.prisma.build.findMany({
        where: {
          projectId: input.projectId,
        },
      });
      return builds;
    }),
  getProject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.userOnProject.findUnique({
        where: {
          projectId_userId: {
            projectId: input.id,
            userId: ctx.session.user.id,
          },
        },
        include: {
          project: {
            select: {
              key: true,
              id: true,
              name: true,
              url: true,
              gitId: true,
              sourceId: true,
              teamId: true,
            },
          },
        },
      });
      if (!project) throw new TRPCError({ code: "UNAUTHORIZED" });
      return project.project;
    }),
  regenerateProjectSecret: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.userOnProject.findUnique({
        where: {
          projectId_userId: {
            projectId: input.id,
            userId: ctx.session.user.id,
          },
        },
        include: {
          project: true,
        },
      });
      if (!project) throw new TRPCError({ code: "UNAUTHORIZED" });
      const rawSecret = crypto.randomUUID();
      const secret = bycrypot.hashSync(rawSecret);
      await ctx.prisma.project.update({
        where: {
          id: input.id,
        },
        data: {
          secret,
        },
      });
      return rawSecret;
    }),
  getProjectWithBuilds: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.userOnProject.findUnique({
        where: {
          projectId_userId: {
            projectId: input.id,
            userId: ctx.session.user.id,
          },
        },
        include: {
          project: {
            select: {
              key: true,
              id: true,
              name: true,
              url: true,
              gitId: true,
              sourceId: true,
              teamId: true,
              builds: true,
            },
          },
        },
      });
      if (!project) throw new TRPCError({ code: "UNAUTHORIZED" });
      return project.project;
    }),
});
