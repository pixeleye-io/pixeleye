import { z } from "zod";
import { createTRPCRouter, protectedProcedureProject } from "../trpc";

const viewport = "";

export const snapshotRouter = createTRPCRouter({
  createSnapshot: protectedProcedureProject
    .input(
      z.object({
        imageId: z.string(),
        sha: z.string(),
        browser: z
          .enum(["CHROME", "FIREFOX", "EDGE", "SAFARI", "UNKNOWN"])
          .default("UNKNOWN"),
        name: z.string(),
        variant: z.string().default(""),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.projectId;
      const { imageId, browser, name, variant, sha } = input;

      const imageSnapshots = {
        connectOrCreate: {
          where: {
            imageId_sha_browser_viewport: {
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
      };

      const snapshot = await ctx.prisma.snapshot.upsert({
        where: {
          sha_name_variant: {
            sha,
            name,
            variant,
          },
        },
        update: {
          imageSnapshots,
        },
        create: {
          sha,
          name,
          variant,
          projectId,
          imageSnapshots,
        },
      });
      return snapshot.id;
    }),
});
