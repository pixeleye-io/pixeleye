import { storage } from "@pixeleye/storage";
import { z } from "zod";
import { createTRPCRouter, protectedProcedureProject } from "../trpc";

export const snapshotRouter = createTRPCRouter({
  getImageUploadUrl: protectedProcedureProject
    .input(
      z.object({
        hash: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const existing = await ctx.prisma.image.findUnique({
        where: {
          hash: input.hash,
        },
      });
      if (existing) {
        return {
          exists: true,
        };
      }
      const data = await storage.getUploadUrl(input.hash);
      // TODO - handle image never being uploaded
      await ctx.prisma.image.create({
        data: {
          hash: input.hash,
        },
      });
      return {
        exists: false,
        data,
      };
    }),
});
