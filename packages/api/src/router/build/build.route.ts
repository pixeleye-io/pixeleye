import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  protectedProcedureProject,
} from "../../trpc";
import {
  createBuild,
  createBuildInput,
  createPartialBuild,
  getBuildFromShas,
  getHeadBuild,
  markBase,
  setParentBranch,
} from "./build.services";

export const buildRouter = createTRPCRouter({
  createBuild: protectedProcedureProject
    .input(createBuildInput)
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.projectId;

      if (input.partial) {
        await createPartialBuild(input, projectId);
        return;
      }

      await createBuild(input, projectId);
    }),
  getHeadBuild: protectedProcedureProject
    .input(
      z.object({
        branch: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const projectId = ctx.projectId;

      return getHeadBuild(input.branch, projectId);
    }),
  getBuild: protectedProcedureProject

    .input(
      z.object({
        shas: z.array(z.string()),
      }),
    )
    .query(async ({ ctx, input }) => {
      const projectId = ctx.projectId;
      const { shas } = input;

      return getBuildFromShas(shas, projectId);
    }),
  markBase: protectedProcedure
    .input(
      z.object({
        buildId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      //TODO kick off build
      return markBase(input.buildId, userId);
    }),
  setParentBranch: protectedProcedure
    .input(
      z.object({
        buildId: z.string(),
        parentBranch: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      return setParentBranch(input.buildId, input.parentBranch, userId);
    }),
});
