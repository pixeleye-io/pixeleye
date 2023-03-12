import { prisma } from "@pixeleye/db";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { App, Octokit } from "octokit";
import { GitProvider } from "./types";

dayjs.extend(relativeTime);

const getListRepos = (octokit: Octokit, installId: string) => async () => {
  const [existingRepos, repos] = await Promise.all([
    prisma.project
      .findMany({
        where: {
          source: {
            githubInstallId: installId,
          },
        },
        select: {
          gitId: true,
        },
      })
      .then((res) => res.map((repo) => repo.gitId)),
    octokit.paginate("GET /installation/repositories"),
  ]);

  return {
    owner: {
      name: repos[0]?.owner.name || repos[0]?.owner.login || "",
      avatar: repos[0]?.owner.avatar_url || "",
      url: repos[0]?.owner.html_url || "",
    },
    repos: await Promise.all(
      repos
        .sort((a, b) => Date.parse(b.pushed_at!) - Date.parse(a.pushed_at!))
        .map(async (repo) => {
          const contributors = await octokit.paginate(
            "GET /repos/{owner}/{repo}/contributors",
            {
              owner: repo.owner.login,
              repo: repo.name,
            },
          );
          const lastUpdated = repo.pushed_at
            ? dayjs().to(dayjs(repo.pushed_at))
            : "unknown";
          return {
            name: repo.name,
            url: repo.html_url,
            id: repo.id.toString(),
            description: repo.description || "",
            lastUpdated,
            private: repo.private,
            exists: existingRepos.includes(repo.id.toString()),
            contributorsCount: contributors.length,
            contributors: contributors.slice(0, 5).map((c) => ({
              name: c.name || c.login!,
              avatar: c.avatar_url,
              id: c.id?.toString() || "",
            })),
          };
        }),
    ),
  };
};

export async function getGithubProvider(
  installId: string,
): Promise<GitProvider> {
  const app = new App({
    appId: process.env.GITHUB_APP_ID!,
    privateKey: process.env.GITHUB_PRIVATE_KEY!,
    oauth: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  });
  const octokit = await app.getInstallationOctokit(Number.parseInt(installId));
  return {
    listRepos: getListRepos(octokit, installId),
  };
}
