import { z } from "zod";
import { createTRPCRouter, protectedProcedureProject } from "../trpc";

export const snapshotRouter = createTRPCRouter({
  createSnapshot: protectedProcedureProject
    .input(
      z.object({
        hash: z.string(),
        sha: z.string(),
        browser: z
          .enum(["CHROME", "FIREFOX", "EDGE", "SAFARI", "UNKNOWN"])
          .optional(),
        name: z.string(),
        variant: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.projectId;
      const { hash, browser, name, variant, sha } = input;
      const snapshot = await ctx.prisma.snapshot.upsert({
        where: {
          sha_name_variant: {
            sha,
            name,
            variant: variant || "",
          },
        },
        update: {
          visualSnapshots: {
            create: {
              image: {
                connectOrCreate: {
                  where: {
                    projectId_hash: {
                      projectId,
                      hash,
                    },
                  },
                  create: {
                    hash,
                    projectId,
                  },
                },
              },
              browser: browser || "UNKNOWN",
            },
          },
        },
        create: {
          name,
          sha,
          variant: variant || "",
          visualSnapshots: {
            create: {
              image: {
                connectOrCreate: {
                  where: {
                    projectId_hash: {
                      projectId,
                      hash,
                    },
                  },
                  create: {
                    hash,
                    projectId,
                  },
                },
              },
              browser: browser || "UNKNOWN",
            },
          },
        },
      });
      return snapshot.id;
    }),
});
