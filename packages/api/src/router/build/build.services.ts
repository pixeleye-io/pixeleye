import { prisma } from "@pixeleye/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const createBuldInput = z.object({
  sha: z.string(),
  title: z.string().optional(),
  branch: z.string(),
  targetSha: z.string().optional(),
  message: z.string().optional(),
  url: z.string().optional(),
});

const baseCreateReportInput = z.object({
  sha: z.string(),
  visualSnapshots: z.array(z.string()),
});

function triggerBuild(buildId: string) {
  return fetch(`${process.env.INGEST_URL}/ingest/build?buildId=${buildId}`);
}

export const createReportInput = z.discriminatedUnion("partial", [
  baseCreateReportInput.extend({
    partial: z.literal(true),
  }),
  baseCreateReportInput
    .extend({
      partial: z.undefined(),
    })
    .merge(createBuldInput),
  baseCreateReportInput
    .extend({
      partial: z.literal(false),
    })
    .merge(createBuldInput),
]);

// Assumes request is authenticated
export async function createReport(
  input: z.infer<typeof createReportInput>,
  projectId: string,
) {
  const { sha, visualSnapshots } = input;

  await prisma.report.upsert({
    where: {
      sha_projectId: {
        projectId,
        sha,
      },
    },
    create: {
      sha,
      projectId,
      snapshots: {
        connect: visualSnapshots.map((id) => ({ id })),
      },
    },
    update: {
      snapshots: {
        connect: visualSnapshots.map((id) => ({ id })),
      },
    },
  });
}

// Assumes request is authenticated
export async function createBuild(
  input: z.infer<typeof createBuldInput>,
  projectId: string,
) {
  const { sha, title, branch, message, targetSha, url } = input;

  const build = await prisma.$transaction(async (tx) => {
    const buildCount = await tx.buildCounts
      .upsert({
        where: {
          projectId,
        },
        create: {
          projectId,
          count: 1,
        },
        update: {
          count: {
            increment: 1,
          },
        },

        select: {
          count: true,
        },
      })
      .then((res) => res.count);

    return await prisma.build.create({
      include: {
        report: {
          include: {
            snapshots: true,
          },
        },
        parent: {
          include: {
            report: {
              include: {
                snapshots: true,
              },
            },
          },
        },
      },
      data: {
        sha,
        title,
        branch,
        message,
        ...(targetSha
          ? {
              parent: {
                connect: {
                  projectId_sha: {
                    projectId,
                    sha: targetSha,
                  },
                },
              },
              status: "PENDING",
            }
          : {
              status: "ORPHANED",
            }),
        url,
        projectId,
        name: `Build ${buildCount}`,
      },
    });
  });

  if (!targetSha) return build;

  await prisma.$transaction(
    build.report.snapshots.map((snap) => {
      const parentSnapshot = build.parent[0]?.report.snapshots.find(
        (pSnap) => snap.name === pSnap.name && snap.variant === pSnap.variant,
      );

      return prisma.snapshot.update({
        where: {
          id: snap.id,
        },
        data: {
          ...(parentSnapshot
            ? {
                baseline: {
                  connect: {
                    id: parentSnapshot?.id,
                  },
                },
              }
            : {}),
        },
      });
    }),
  );

  await triggerBuild(build.id);

  return build;
}

// There can be multiple builds if branches are renamed
// This will return the latest build, users will need to create a patch build if they want to compare against a specific build
export async function getHeadBuild(branch: string, projectId: string) {
  const build = await prisma.build.findFirst({
    where: {
      projectId,
      branch,
      child: {
        none: {},
      },
    },
    include: {
      report: {
        include: {
          snapshots: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return build;
}

export async function getBuildFromShas(shas: string[], projectId: string) {
  const builds = await prisma.build.findMany({
    where: {
      projectId,
      sha: {
        in: shas,
      },
    },
  });

  return builds.sort((a, b) => {
    return shas.indexOf(a.sha) - shas.indexOf(b.sha);
  })[0];
}

//TODO stop self referencing as parent
export async function setParentBranch(
  buildId: string,
  parentBranch: string,
  userId: string,
) {
  const build = await prisma.build.findUnique({
    where: {
      id: buildId,
    },
    include: {
      parent: true,
      report: {
        include: {
          snapshots: true,
        },
      },
      project: {
        select: {
          users: {
            where: {
              userId,
            },
          },
        },
      },
    },
  });

  if (!build)
    throw new TRPCError({
      code: "NOT_FOUND",
    });

  if (build.project.users.length !== 1)
    throw new TRPCError({ code: "UNAUTHORIZED" });

  if (build.parent.length !== 0)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Build already has a parent",
    });

  const parentBuild = await getHeadBuild(parentBranch, build.projectId);

  if (!parentBuild)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Parent build not found",
    });

  await prisma.build.update({
    where: {
      id: buildId,
    },
    data: {
      parent: {
        connect: {
          id: parentBuild.id,
        },
      },
      status: "PENDING",
    },
  });

  await prisma.$transaction(
    build.report.snapshots.map((snap) => {
      const parentSnapshot = parentBuild.report.snapshots.find(
        (pSnap) => snap.name === pSnap.name && snap.variant === pSnap.variant,
      );

      return prisma.snapshot.update({
        where: {
          id: snap.id,
        },
        data: {
          ...(parentSnapshot
            ? {
                baseline: {
                  connect: {
                    id: parentSnapshot?.id,
                  },
                },
              }
            : {}),
        },
      });
    }),
  );

  await triggerBuild(buildId);
}

export async function markBase(buildId: string, userId: string) {
  const build = await prisma.build.findUnique({
    where: {
      id: buildId,
    },
    include: {
      parent: true,
      project: {
        select: {
          users: {
            where: {
              userId,
            },
          },
        },
      },
    },
  });

  if (!build)
    throw new TRPCError({
      code: "NOT_FOUND",
    });

  if (build.project.users.length !== 1)
    throw new TRPCError({ code: "UNAUTHORIZED" });

  if (build.parent.length !== 0)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Build already has a parent",
    });

  if (build.base)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Build is already a base",
    });

  await prisma.build.update({
    where: {
      id: buildId,
    },
    data: {
      base: true,
      status: "COMPLETED",
    },
  });
}
