import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  protectedProcedureProject,
} from "../trpc";

export const buildRouter = createTRPCRouter({
  createBuild: protectedProcedureProject
    .input(
      z.object({
        sha: z.string(),
        visualSnapshots: z.array(z.string()),
        domSnapshots: z.array(z.string()).optional(),
        partial: z.boolean().optional(),
        url: z.string().optional(),
        author: z.string().optional(),
        pullRequestTitle: z.string().optional(),
        commitMessage: z.string(),
        branch: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.projectId;
      const {
        sha,
        visualSnapshots,
        author,
        domSnapshots,
        partial,
        url,
        pullRequestTitle,
        commitMessage,
        branch,
      } = input;

      const predecessorId = await ctx.prisma.build.findFirst({
        where: {
          projectId,
          branch,
          successor: {
            is: null,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
        },
      });

      const build = await ctx.prisma.build.upsert({
        where: {
          projectId_sha: {
            projectId,
            sha,
          },
        },
        update: {
          commitMessage,
          pullRequestTitle,
          url,
          branch,
          author,
        },
        create: {
          branch,
          ...(predecessorId && {
            predecessor: {
              connect: {
                id: predecessorId.id,
              },
            },
          }),
          sha,
          commitMessage,
          pullRequestTitle,
          url,
          author,
          Snapshots: {
            connect: visualSnapshots.map((id) => ({
              id,
            })),
          },
          Project: {
            connect: {
              id: projectId,
            },
          },
        },
        select: {
          id: true,
          Snapshots: {
            select: {
              name: true,
              variant: true,
              visualSnapshots: {
                select: {
                  id: true,
                  image: true,
                  browser: true,
                },
              },
            },
          },
          predecessor: {
            select: {
              Snapshots: {
                select: {
                  name: true,
                  variant: true,
                  visualSnapshots: {
                    select: {
                      image: true,
                      browser: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!partial) {
        const visualDifferences: {
          visualSnapshot: (typeof build.Snapshots)[0]["visualSnapshots"][0];
          snapshot: (typeof build.Snapshots)[0];
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          predecessorVisualSnapshot: (typeof build.predecessor.Snapshots)[0]["visualSnapshots"][0];
        }[] = [];
        build.Snapshots.forEach((snapshot) => {
          const predecessorSnapshot = build.predecessor?.Snapshots.find(
            ({ name, variant }) =>
              name === snapshot.name && variant === snapshot.variant,
          );

          if (!predecessorSnapshot) return;
          snapshot.visualSnapshots.forEach((visualSnapshot) => {
            const predecessorVisualSnapshot =
              predecessorSnapshot.visualSnapshots.find(
                ({ browser }) => browser === visualSnapshot.browser,
              );
            if (
              !predecessorVisualSnapshot ||
              predecessorVisualSnapshot.image.hash === visualSnapshot.image.hash
            )
              return;

            visualDifferences.push({
              visualSnapshot,
              snapshot,
              predecessorVisualSnapshot,
            });
          });
        });

        const visDiffIds = await Promise.all(
          visualDifferences.map(
            ({ visualSnapshot, snapshot, predecessorVisualSnapshot }) =>
              ctx.prisma.visualSnapshot.update({
                where: {
                  id: visualSnapshot.id,
                },
                select: {
                  visualDifferenceId: true,
                },
                data: {
                  VisualDifference: {
                    create: {
                      status: "PENDING",
                      baseImage: {
                        connect: {
                          id: predecessorVisualSnapshot.image.id,
                        },
                      },
                      image: {
                        connect: {
                          id: visualSnapshot.image.id,
                        },
                      },
                    },
                  },
                },
              }),
          ),
        ).then((res) => res.filter((r) => Boolean(r.visualDifferenceId)));

        if (visDiffIds.length !== 0) {
          await ctx.qImageDiff.enqueueMany(
            visDiffIds.map(({ visualDifferenceId }) => ({
              payload: {
                visualDifferenceId: visualDifferenceId || "",
                buildId: build.id,
              },
            })),
          );
        } else {
          await ctx.prisma.build.update({
            where: {
              projectId_sha: {
                projectId,
                sha,
              },
            },
            data: {
              status: "COMPLETED",
            },
          });
        }
      }
    }),
  getWithSnapshots: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const userId = ctx.session.user.id;
      const build = await ctx.prisma.build.findUnique({
        where: {
          id,
        },
        include: {
          Project: {
            select: {
              users: {
                where: {
                  userId,
                },
              },
            },
          },
          Snapshots: {
            select: {
              id: true,
              name: true,
              variant: true,
              visualSnapshots: {
                select: {
                  image: true,
                  VisualDifference: {
                    include: {
                      diffImage: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!build) throw new TRPCError({ code: "NOT_FOUND" });

      if (build.Project.users.length === 0)
        throw new TRPCError({ code: "UNAUTHORIZED" });

      return {
        ...build,
        Project: undefined,
      };
    }),

  getWithProject: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const userId = ctx.session.user.id;
      const build = await ctx.prisma.build.findUnique({
        where: {
          id,
        },
        include: {
          Project: {
            select: {
              users: {
                where: {
                  userId,
                },
              },
              id: true,
              name: true,
              url: true,
              teamId: true,
              gitId: true,
              sourceId: true,
            },
          },
        },
      });

      if (!build) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (build.Project.users.length === 0) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return {
        ...build,
        Project: {
          ...build.Project,
          users: undefined,
        },
      };
    }),
});
