import { App } from "@octokit/app";

const app = new App({
  appId: process.env.APP_ID!,
  privateKey: process.env.PRIVATE_KEY!,
  oauth: {
    clientId: process.env.GITHUB_APP_CLIENT_ID!,
    clientSecret: process.env.GITHUB_APP_CLIENT_SECRET!,
  },
});

export const getOctokit = (installationId: number) =>
  app.getInstallationOctokit(installationId);

export const getUesr = (userName: string) =>
  app.octokit.request("GET /users/{username}/installation", {
    username: userName,
  });
export const getUserOctokit = (options: {
  refreshToken: string;
  refreshTokenExpiresAt: string;
  token: string;
  expiresAt: string;
}) => app.oauth.getUserOctokit(options);

export const getRepos = (userName: string) =>
  app.octokit.request(
    "GET /user/installations/{installation_id}/repositories",
    {
      installation_id: Number(process.env.APP_ID!),
    },
  );

export const userConnected = (userName: string) =>
  app.octokit.request("GET /users/{username}/installation", {
    username: userName,
  });

export const eachInstallation = app.eachInstallation;
