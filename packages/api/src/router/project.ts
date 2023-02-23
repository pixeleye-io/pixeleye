import crypto from "crypto";
import { PrismaClient } from "@pixeleye/db";
import { TRPCError } from "@trpc/server";
import bycrypot from "bcryptjs";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

const createProjectInput = z.object({
  name: z.string(),
  type: z.enum(["GITHUB", "GITLAB", "BITBUCKET", "OTHER"]),
  url: z.string().optional(),
  teamId: z.string().optional(),
  github: z
    .object({
      gitId: z.string(),
      installId: z.string(),
    })
    .optional(),
});

interface CreateProjectOutput {
  secret: string;
  key: string;
  id: string;
}

async function createGithubProject(
  prisma: PrismaClient,
  userId: string,
  input: z.infer<typeof createProjectInput>,
): Promise<CreateProjectOutput> {
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
            gitId: input.github!.gitId,
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
          type: "ADMIN",
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
      let data: CreateProjectOutput;
      switch (input.type) {
        case "GITHUB":
          data = await createGithubProject(
            ctx.prisma,
            ctx.session.user.id,
            input,
          );
          break;
        default:
          return;
      }
      const teamAdmins = await ctx.prisma.userOnTeam.findMany({
        where: {
          teamId: input.teamId,
          role: "ADMIN",
        },
        include: {
          user: true,
        },
      });
      await ctx.prisma.userOnProject.createMany({
        skipDuplicates: true,
        data: teamAdmins.map((u) => ({
          userId: u.userId,
          projectId: data.id,
          role: "OWNER",
          type: "ADMIN",
        })),
      });
      return data;
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
  getProjectWithUsers: protectedProcedure
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
              name: true,
              url: true,
              gitId: true,
              sourceId: true,
              teamId: true,
              users: {
                select: {
                  user: true,
                  role: true,
                  type: true,
                },
              },
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
              builds: {
                select: {
                  id: true,
                  status: true,
                  createdAt: true,
                  author: true,
                  branch: true,
                  commitMessage: true,
                  pullRequestTitle: true,
                  sha: true,
                  url: true,
                },
                orderBy: {
                  createdAt: "desc",
                },
              },
            },
          },
        },
      });
      if (!project) throw new TRPCError({ code: "UNAUTHORIZED" });
      return project.project;
    }),
});
