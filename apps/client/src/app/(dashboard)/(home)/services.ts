import { prisma } from "@pixeleye/db";
import "server-only";

// Assumes every user has a team
export async function getTeam(userId: string, teamId?: string) {
  return prisma.userOnTeam
    .findFirst({
      where: {
        teamId,
        userId,
        ...(!teamId ? { role: "OWNER" } : {}),
      },
      select: {
        team: {
          select: {
            id: true,
            type: true,
            projects: {
              where: {
                users: {
                  some: {
                    userId,
                  },
                },
              },
              select: {
                id: true,
                url: true,
                name: true,
              },
            },
          },
        },
      },
    })
    .then((userOnTeam) => userOnTeam?.team);
}
