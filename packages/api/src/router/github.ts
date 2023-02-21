import { PrismaClient, prisma } from "@pixeleye/db";
import { getOctokit, getOrgUsers, githubApp } from "@pixeleye/github";
import { TRPCClientError } from "@trpc/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  protectedProcedureGithub,
  publicProcedure,
} from "../trpc";

export const githubRouter = createTRPCRouter({
  getInstallations: protectedProcedureGithub
    .input(
      z
        .object({
          page: z.number().optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) => {
      return ctx.userOctokit
        .request("GET /user/installations", {
          page: input?.page,
        })
        .then(({ data }) => data.installations);
    }),
  updateInstallation: publicProcedure
    .input(
      z.object({
        installationId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const installation_id = input.installationId;

      const octokit = await getOctokit(installation_id).catch((err) => {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      });

      const installation = await octokit
        .request("GET /app/installations/{installation_id}", {
          installation_id,
        })
        .then(({ data }) => data);

      if (!installation.account?.id) throw new TRPCError({ code: "NOT_FOUND" });

      if (installation.account.type === "User") {
        // We need to cover the case where an app is installed but the user has not yet signed up (rare but possible)
        // We create the source and link it to the user if they ever sign up
        // TODO possibly run a cron job to clean these up

        const teamId = await prisma.account
          .findUnique({
            where: {
              provider_providerAccountId: {
                provider: "github",
                providerAccountId: installation.account.id.toString(),
              },
            },
            select: {
              user: {
                select: {
                  UserOnTeam: {
                    where: {
                      owner: true,
                    },
                    select: {
                      teamId: true,
                    },
                  },
                },
              },
            },
          })
          .then((user) => user?.user.UserOnTeam[0]?.teamId)
          .catch((err) => undefined);

        await prisma.source.upsert({
          where: {
            gitId: installation.account.id.toString(),
          },
          select: {
            teamId: true,
            id: true,
          },
          update: {
            githubInstallId: installation_id.toString(),
          },
          create: {
            type: "GITHUB",
            gitId: installation.account.id.toString(),
            githubInstallId: installation_id.toString(),
            ...(teamId && {
              team: {
                connect: {
                  id: teamId,
                },
              },
            }),
          },
        });

        return { teamId };
      }
      const source = await ctx.prisma.source.upsert({
        where: {
          gitId: installation.account.id.toString(),
        },
        select: {
          teamId: true,
        },
        update: {
          githubInstallId: installation_id.toString(),
        },
        create: {
          type: "GITHUB",
          gitId: installation.account.id.toString(),
          githubInstallId: installation_id.toString(),
          Team: {
            create: {
              name: installation.account.login || "New Team",
              type: "GITHUB",
            },
          },
        },
      });

      // TODO refresh team members
      return { teamId: source.teamId };
    }),

  getMembers: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const installation_id = await ctx.prisma.source
        .findUnique({
          where: {
            type_teamId: {
              type: "GITHUB",
              teamId: input.teamId,
            },
          },
          select: {
            githubInstallId: true,
          },
        })
        .then((source) => source?.githubInstallId);

      if (!installation_id) throw new TRPCError({ code: "NOT_FOUND" });

      const [octokit, org] = await Promise.all([
        getOctokit(Number.parseInt(installation_id)),
        githubApp.octokit
          .request("GET /app/installations/{installation_id}", {
            installation_id: Number.parseInt(installation_id),
          })
          .then(({ data }) => data.account?.login),
      ]);

      if (!org) throw new TRPCError({ code: "NOT_FOUND" });

      const [members, admins] = await Promise.all([
        octokit
          .request("GET /orgs/{org}/members", {
            org,
            role: "member",
          })
          .then(({ data }) => data),
        octokit
          .request("GET /orgs/{org}/members", {
            org,
            role: "admin",
          })
          .then(({ data }) => data),
      ]);

      return [members, admins];
    }),
  getRepositories: protectedProcedureGithub
    .input(
      z.object({
        installationId: z.number(),
        page: z.number().optional(),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.userOctokit
        .request("GET /user/installations/{installation_id}/repositories", {
          installation_id: input.installationId,
          page: input.page,
        })
        .then(({ data }) => data.repositories);
    }),
});
