import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const snapshotRouter = createTRPCRouter({
  getImageUrl: protectedProcedure
    .input(
      z.object({
        hash: z.string(),
      }),
    )
    .query(() => {
      return "you can see this secret message!";
    }),
});
