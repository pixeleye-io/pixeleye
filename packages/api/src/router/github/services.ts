import { Prisma, prisma } from "@pixeleye/db";
import { getOctokit } from "@pixeleye/github";
import { TRPCError } from "@trpc/server";

export async function refreshMembers(
  ctx: { prisma: typeof prisma },
  teamId: string,
) {
  const team = await ctx.prisma.team.findUnique({
    where: {
      id: teamId,
    },
    select: {
      Source: true,
      type: true,
    },
  });

  if (!team) throw new TRPCError({ code: "NOT_FOUND" });
  if (team.type !== "GITHUB") throw new TRPCError({ code: "BAD_REQUEST" });

  const installId = team.Source.find(
    (source) => source.type === "GITHUB",
  )?.githubInstallId;

  if (!installId) throw new TRPCError({ code: "NOT_FOUND" });

  const installation_id = Number.parseInt(installId);

  const octokit = await getOctokit(installation_id);

  const org = await octokit
    .request("GET /app/installations/{installation_id}", {
      installation_id,
    })
    .then(({ data }) => data.account?.login);

  if (!org) throw new TRPCError({ code: "NOT_FOUND" });

  const [admins, members] = await Promise.all([
    await octokit
      .request("GET /orgs/{org}/members", {
        org,
        role: "admin",
      })
      .then(({ data }) => data),

    await octokit
      .request("GET /orgs/{org}/members", {
        org,
        role: "member",
      })
      .then(({ data }) => data),
  ]);

  const users = [...admins, ...members];

  const usersDb = await ctx.prisma.user.findMany({
    where: {
      accounts: {
        some: {
          provider: "github",
          providerAccountId: {
            in: users.map((user) => user.id.toString()),
          },
        },
      },
    },
    select: {
      id: true,
      email: true,
      accounts: {
        where: {
          provider: "github",
        },
      },
    },
  });

  const membersFiltered = usersDb.filter((member) =>
    Boolean(
      members.find((user) =>
        Boolean(
          member.accounts.find(
            (acc) => acc.providerAccountId === user.id.toString(),
          ),
        ),
      ),
    ),
  );
  const adminsFiltered = usersDb.filter((member) =>
    Boolean(
      admins.find((user) =>
        Boolean(
          member.accounts.find(
            (acc) => acc.providerAccountId === user.id.toString(),
          ),
        ),
      ),
    ),
  );

  const usersFiltered = [...membersFiltered, ...adminsFiltered];

  console.log("members", membersFiltered, "admins", adminsFiltered);

  await prisma.$transaction([
    // Delete users that are no longer in the org
    prisma.userOnTeam.deleteMany({
      where: {
        teamId,
        userId: {
          notIn: usersFiltered.map((user) => user.id),
        },
      },
    }),
    // Update users that are in the org but have changed roles to admin
    prisma.userOnTeam.updateMany({
      where: {
        teamId,
        userId: {
          in: adminsFiltered.map((admin) => admin.id.toString()),
        },
        role: {
          equals: "MEMBER",
        },
        user: {
          accounts: {
            some: {
              provider: "github",
              providerAccountId: {
                in: admins.map((admin) => admin.id.toString()),
              },
            },
          },
        },
      },
      data: {
        role: "ADMIN",
      },
    }),
    // Update users that are in the org but have changed roles to member
    prisma.userOnTeam.updateMany({
      where: {
        teamId,
        userId: {
          in: membersFiltered.map((member) => member.id.toString()),
        },
        role: {
          equals: "ADMIN",
        },
        user: {
          accounts: {
            some: {
              provider: "github",
              providerAccountId: {
                in: members.map((member) => member.id.toString()),
              },
            },
          },
        },
      },
      data: {
        role: "MEMBER",
      },
    }),
    // Create users that are in the org but not in the team
    prisma.userOnTeam.createMany({
      data: [
        ...membersFiltered.map((user) => ({
          teamId,
          userId: user.id,
          role: "MEMBER",
        })),
        ...adminsFiltered.map((user) => ({
          teamId,
          userId: user.id,
          role: "ADMIN",
        })),
      ] as Prisma.Enumerable<Prisma.UserOnTeamCreateManyInput>,
      skipDuplicates: true,
    }),
  ]);
}
