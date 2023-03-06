import "server-only";
import { prisma } from "@pixeleye/db";

export async function getProjectUsers(projectId: string, userId: string) {
  return prisma.userOnProject.findMany({
    where: {
      projectId,
      project: {
        users: {
          some: {
            userId,
          },
        },
      },
    },
    select: {
      userId: true,
      role: true,
      type: true,
      user: {
        select: {
          name: true,
          email: true,
          id: true,
          image: true,
        },
      },
    },
  });
}
