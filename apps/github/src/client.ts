import { App } from "@octokit/app";

const app = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_PRIVATE_KEY!,
  oauth: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
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

export const getOrgUsers = (installation_id: number, org: string) =>
  getOctokit(installation_id).then((octokit) =>
    octokit.request("GET /orgs/{org}/members", {
      org,
      role: "member",
    }),
  );
// app.octokit.request("GET /app/installations/{installation_id}", {
//   installation_id,
// });

export const eachInstallation = app.eachInstallation;

export const githubApp = app;
