import { storage } from "@pixeleye/storage";
import { z } from "zod";
import { createTRPCRouter, protectedProcedureProject } from "../trpc";

export const imageRouter = createTRPCRouter({
  getUploadUrl: protectedProcedureProject
    .input(
      z.object({
        hash: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const existing = await ctx.prisma.image.findUnique({
        where: {
          projectId_hash: {
            projectId: ctx.projectId,
            hash: input.hash,
          },
        },
      });
      if (existing) {
        return {
          exists: true,
        };
      }
      const { endpoint, ...data } = await storage.getUploadUrl(
        input.hash,
        ctx.projectId,
      );
      // TODO - handle image never being uploaded
      await ctx.prisma.image.create({
        data: {
          hash: input.hash,
          projectId: ctx.projectId,
          url: endpoint,
        },
      });
      return {
        exists: false,
        data,
      };
    }),
});
