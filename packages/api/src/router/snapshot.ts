import { storage } from "@pixeleye/storage";
import { z } from "zod";
import { createTRPCRouter, protectedProcedureProject } from "../trpc";

export const snapshotRouter = createTRPCRouter({
  createSnapshot: protectedProcedureProject
    .input(
      z.object({
        hash: z.string(),
        browser: z.enum(["CHROME", "FIREFOX", "EDGE", "SAFARI"]).optional(),
        name: z.string(),
        variant: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.projectId;
      const { hash, browser, name, variant } = input;
      const snapshot = await ctx.prisma.snapshot.upsert({
        where: {
          name_variant: {
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
              browser,
            },
          },
        },
        create: {
          name,
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
              browser,
            },
          },
        },
      });
      return snapshot.id;
    }),
});
