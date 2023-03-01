import { TRPCError } from "@trpc/server";
import bycrypot from "bcryptjs";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import {
  CreateProjectOutput,
  createGithubProject,
  createProjectInput,
  generateSecret,
} from "./project.service";

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
        if (!input.teamId) throw new TRPCError({ code: "UNAUTHORIZED" });
      } else {
        const userOnTeam = await ctx.prisma.userOnTeam.findUnique({
          where: {
            teamId_userId: {
              teamId: input.teamId,
              userId: ctx.session.user.id,
            },
          },
        });
        if (
          !userOnTeam ||
          !(userOnTeam.role === "ADMIN" || userOnTeam.role === "OWNER")
        )
          throw new TRPCError({ code: "UNAUTHORIZED" });
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
      const rawSecret = generateSecret();
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
});
