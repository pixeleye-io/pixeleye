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

export const createReportInput = z.discriminatedUnion("partial", [
  baseCreateReportInput.extend({
    partial: z.literal(false),
  }),
  baseCreateReportInput.extend({
    partial: z.undefined(),
  }),
  baseCreateReportInput
    .extend({
      partial: z.literal(true),
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

    await prisma.build.create({
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
            }
          : {}),
        url,
        projectId,
        status: "ORPHANED",
        name: `Build ${buildCount}`,
      },
    });
  });

  return build;
}

// There can be multiple builds if branches are renamed
// This will return the latest build, users will need to create a patch build if they want to compare against a specific build
export async function getHeadBuild(branch: string, projectId: string) {
  const build = await prisma.build.findFirst({
    where: {
      projectId,
      branch,
      parent: {
        none: {},
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
      status: "PENDING",
    },
  });
}
