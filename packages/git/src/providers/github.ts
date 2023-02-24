import { App, Octokit } from "octokit";
import { GitProvider } from "./types";

const getGetRepos = (octokit: Octokit) => () => {
  return octokit.request("GET /installation/repositories").then((res) => {
    return res.data.repositories.map((repo) => ({
      name: repo.name,
      url: repo.html_url,
    }));
  });
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
    getRepos: getGetRepos(octokit),
  };
}
