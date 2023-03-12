import { Prisma, prisma } from "@pixeleye/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const baseCreatePartialBuildInput = z.object({
  sha: z.string(),
  visualSnapshots: z
    .array(
      z.object({
        imageId: z.string(),
        browser: z
          .enum(["CHROME", "FIREFOX", "EDGE", "SAFARI", "UNKNOWN"])
          .default("UNKNOWN"),
        name: z.string(),
        viewport: z.string().optional(),
        variant: z.string().default(""),
      }),
    )
    .optional(),
});

export const baseCreateBuldInput = z
  .object({
    sha: z.string(),
    title: z.string().optional(),
    branch: z.string(),
    targetSha: z.string().optional(),
    message: z.string().optional(),
    pullRequestURL: z.string().optional(),
    commitURL: z.string().optional(),
  })
  .merge(baseCreatePartialBuildInput);

function triggerBuild(buildId: string) {
  return fetch(`${process.env.INGEST_URL!}/build?id=${buildId}`);
}

export const createBuildInput = z.discriminatedUnion("partial", [
  baseCreatePartialBuildInput.extend({
    partial: z.literal(true),
  }),
  baseCreateBuldInput.extend({
    partial: z.undefined(),
  }),
  baseCreateBuldInput.extend({
    partial: z.literal(false),
  }),
]);

// visualSnapshots?.map( visualSnapshots?.map(
//   ({ imageId, browser, name, variant, viewport }) => {
//     const imageSnapshots = {
//       connectOrCreate: {
//         where: {
//           projectId_imageId_sha_browser_viewport: {
//             projectId,
//             imageId,
//             sha,
//             browser,
//             viewport,
//           },
//         },
//         create: {
//           imageId,
//           sha,
//           browser,
//           viewport,
//           projectId,
//         },
//       },
//     };

//     return {
//       where: {
//         projectId_sha_name_variant: {
//           projectId,
//           sha,
//           name,
//           variant,
//         },
//       },
//       data: {
//         sha,
//         projectId,
//         name,
//         variant,
//         imageSnapshots,
//       },
//     } as Prisma.SnapshotCreateManyBuildInputEnvelope;
//   },
// ),
// Assumes request is authenticated
export async function createPartialBuild(
  input: z.infer<typeof baseCreatePartialBuildInput>,
  projectId: string,
) {
  const { sha, visualSnapshots } = input;

  const snapshots:
    | Prisma.SnapshotUncheckedCreateNestedManyWithoutBuildInput
    | undefined =
    ((visualSnapshots?.length ?? 0) > 0 && {
      createMany: {
        data: visualSnapshots!.map(
          ({ imageId, browser, name, variant, viewport }) => {
            return {
              sha,
              projectId,
              name,
              variant,
              imageSnapshots: {
                connectOrCreate: {
                  where: {
                    projectId_imageId_sha_browser_viewport: {
                      projectId,
                      imageId,
                      sha,
                      browser,
                      viewport,
                    },
                  },
                  create: {
                    imageId,
                    sha,
                    browser,
                    viewport,
                    projectId,
                  },
                },
              },
            };
          },
        ),
      },
    }) ||
    undefined;

  await prisma.build.upsert({
    where: {
      projectId_sha: {
        projectId,
        sha,
      },
    },
    create: {
      sha,
      projectId,
      snapshots,
    },
    update: {
      snapshots,
    },
  });
}

// Assumes request is authenticated
export async function createBuild(
  input: z.infer<typeof baseCreateBuldInput>,
  projectId: string,
) {
  const {
    sha,
    title,
    branch,
    message,
    targetSha,
    pullRequestURL,
    commitURL,
    visualSnapshots,
  } = input;

  const snapshots:
    | Prisma.SnapshotUncheckedCreateNestedManyWithoutBuildInput
    | undefined =
    ((visualSnapshots?.length ?? 0) > 0 && {
      createMany: {
        data: visualSnapshots!.map(
          ({ imageId, browser, name, variant, viewport }) => {
            return {
              sha,
              projectId,
              name,
              variant,
              imageSnapshots: {
                connectOrCreate: {
                  where: {
                    projectId_imageId_sha_browser_viewport: {
                      projectId,
                      imageId,
                      sha,
                      browser,
                      viewport,
                    },
                  },
                  create: {
                    imageId,
                    sha,
                    browser,
                    viewport,
                    projectId,
                  },
                },
              },
            };
          },
        ),
      },
    }) ||
    undefined;

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

    return await prisma.build.upsert({
      include: {
        snapshots: true,
        parent: {
          include: {
            snapshots: true,
          },
        },
      },
      where: {
        projectId_sha: {
          projectId,
          sha,
        },
      },
      create: {
        snapshots,
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
        pullRequestURL,
        commitURL,
        projectId,
        name: `Build ${buildCount}`,
      },
      update: {
        title,
        branch,
        message,
        pullRequestURL,
        commitURL,
        snapshots,
      },
    });
  });

  if (!targetSha) return build;

  // TODO - do this in the transaction above
  // await prisma.$transaction(
  //   build.snapshots.map((snap) => {
  //     const parentSnapshot = build.parent[0]?.snapshots.find(
  //       (pSnap) => snap.name === pSnap.name && snap.variant === pSnap.variant,
  //     );

  //     return prisma.snapshot.update({
  //       where: {
  //         id: snap.id,
  //       },
  //       data: {
  //         ...(parentSnapshot
  //           ? {
  //               baseline: {
  //                 connect: {
  //                   id: parentSnapshot?.id,
  //                 },
  //               },
  //             }
  //           : {}),
  //       },
  //     });
  //   }),
  // );

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
      snapshots: true,
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
      snapshots: true,
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
    build.snapshots.map((snap) => {
      const parentSnapshot = parentBuild.snapshots.find(
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
