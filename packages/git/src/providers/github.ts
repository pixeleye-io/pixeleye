import { App, Octokit } from "octokit";
import { GitProvider } from "./types";

const getListRepos = (octokit: Octokit) => () => {
  return octokit.paginate("GET /installation/repositories").then((res) =>
    Promise.all(
      res?.map(async (repo) => {
        const contributors = await octokit.paginate(
          "GET /repos/{owner}/{repo}/contributors",
          {
            owner: repo.owner.login,
            repo: repo.name,
          },
        );
        return {
          name: repo.name,
          url: repo.html_url,
          id: repo.id.toString(),
          contributors: contributors.slice(0, 5).map((c) => ({
            name: c.name || c.login!,
            avatar: c.avatar_url,
            id: c.id?.toString() || "",
          })),
        };
      }),
    ),
  );
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
    listRepos: getListRepos(octokit),
  };
}
