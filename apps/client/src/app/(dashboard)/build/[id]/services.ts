import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@pixeleye/db";

export async function getBuild(id: string, userId: string) {
  const build = await prisma.build.findUnique({
    where: {
      id,
    },
    select: {
      name: true,
      projectId: true,
      status: true,
      project: {
        select: {
          users: {
            where: {
              userId,
            },
          },
          name: true,
        },
      },
    },
  });

  if (!build?.project.users) return redirect("/");

  return build;
}

export async function getBuildWithScreenShots(id: string, userId: string) {
  const build = await prisma.build.findUnique({
    where: {
      id,
    },
    include: {
      project: {
        select: {
          users: {
            select: {
              userId: true,
            },
            where: {
              userId,
            },
          },
          name: true,
        },
      },
      parent: {
        select: {
          name: true,
          sha: true,
          status: true,
        },
      },
      report: {
        include: {
          snapshots: {
            include: {
              imageSnapshots: {
                include: {
                  image: true,
                  diffImage: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (build?.project?.users.length === 0) return redirect("/");

  return build;
}

export const getProjectBranches = async (projectId: string) => {
  return prisma.build
    .groupBy({
      by: ["branch"],
      where: {
        projectId,
      },
      orderBy: {
        branch: "asc",
      },
    })
    .then((branches) => {
      return branches.map((branch) => branch.branch);
    });
};
