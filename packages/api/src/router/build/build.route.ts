import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  protectedProcedureProject,
} from "../../trpc";
import {
  createBuild,
  createBuldInput,
  createReport,
  createReportInput,
  getBuildFromShas,
  getHeadBuild,
  markBase,
} from "./build.services";

export const buildRouter = createTRPCRouter({
  createReport: protectedProcedureProject
    .input(createReportInput)
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.projectId;

      await createReport(input, projectId);

      if (input.partial) return createBuild(input, projectId);
    }),
  createBuild: protectedProcedureProject
    .input(createBuldInput)
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.projectId;

      return createBuild(input, projectId);
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
});
