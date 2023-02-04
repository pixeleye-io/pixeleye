import { App } from "@octokit/app";

const app = new App({
  appId: process.env.APP_ID!,
  privateKey: process.env.PRIVATE_KEY!,
  oauth: {
    clientId: process.env.GITHUB_APP_CLIENT_ID!,
    clientSecret: process.env.GITHUB_APP_CLIENT_SECRET!,
  },
});

export const octokit = (installationId: number) =>
  app.getInstallationOctokit(installationId);

export const eachInstallation = app.eachInstallation;
