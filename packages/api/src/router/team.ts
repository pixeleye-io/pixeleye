import { createTRPCRouter, protectedProcedure } from "../trpc";

export const teamRouter = createTRPCRouter({
  getUserTeams: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.team.findMany({
      where: {
        userId: ctx.session.user.id,
      },
    });
  }),
});
