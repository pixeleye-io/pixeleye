import "server-only";
import { prisma } from "@pixeleye/db";

export async function getProject(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      url: true,
      name: true,
      builds: {
        orderBy: {
          createdAt: "desc",
        },
      },
      key: true,
      users: {
        where: {
          userId,
        },
        select: {
          role: true,
        },
      },
      teamId: true,
    },
  });
  // User must be a member of the project
  if (project?.users[0]) return project;
}
