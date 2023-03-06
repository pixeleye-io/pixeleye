import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@pixeleye/db";
import { getGitProvider } from "@pixeleye/git";
import { getSession } from "next-auth/react";

export type Repos = Awaited<ReturnType<typeof getGithubRepos>>["repos"];

export async function getTeamId(teamId?: string) {
  if (!teamId) {
    const session = await getSession();
    const userOnTeam = await prisma.userOnTeam.findFirst({
      where: {
        userId: session?.user.id,
        role: "OWNER",
      },
    });
    if (!userOnTeam) return redirect("/");
    teamId = userOnTeam.teamId;
  }
  return teamId;
}

export async function getGithubRepos(teamId: string, userId: string) {
  const source = await prisma.source.findUnique({
    where: {
      type_teamId: {
        teamId,
        type: "GITHUB",
      },
    },
    include: {
      Team: {
        select: {
          users: {
            where: {
              userId,
            },
          },
        },
      },
    },
  });

  if (!source?.githubInstallId || source.Team?.users.length === 0)
    return redirect("/");

  const git = await getGitProvider(source);

  return {
    repos: await git.listRepos(),
    installId: source.githubInstallId,
  };
}

export async function getOtherInstalls(teamId: string, userId: string) {
  const installs = await prisma.source.findMany({
    where: {
      type: "GITHUB",
      Team: {
        users: {
          some: {
            userId,
          },
        },
      },
      teamId: {
        not: teamId,
      },
    },
    select: {
      Team: {
        select: {
          name: true,
          id: true,
        },
      },
    },
  });

  return installs.map((install) => ({
    name: install.Team?.name,
    id: install.Team?.id,
    avatar: "https://avatars.githuadsfbusercontent.com/adsf",
  }));
}
