import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const teamRouter = createTRPCRouter({
  getUserTeams: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.team.findMany({
      where: {
        userId: ctx.session.user.id,
      },
    });
  }),

  getUserTeam: protectedProcedure
    .input(z.object({ id: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (!input?.id) {
        const team = await ctx.prisma.userOnTeam.findFirst({
          where: {
            userId: ctx.session.user.id,
            team: {
              type: "USER",
            },
          },
          include: {
            team: true,
          },
        });
        if (team) return team.team;
        return ctx.prisma.team.create({
          data: {
            name: ctx.session.user.name || "My Team",
            type: "USER",
            users: {
              create: {
                userId: ctx.session.user.id,
                role: "OWNER",
              },
            },
          },
        });
      }
      return ctx.prisma.userOnTeam
        .findUnique({
          where: {
            teamId_userId: {
              teamId: input.id,
              userId: ctx.session.user.id,
            },
          },
          include: {
            team: true,
          },
        })
        .then((u) => u?.team);
    }),
});
