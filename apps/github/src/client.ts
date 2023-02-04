import { App } from "@octokit/app";

export const githubApp = new App({
  appId: process.env.APP_ID!,
  privateKey: process.env.PRIVATE_KEY!,
  oauth: {
    clientId: process.env.GITHUB_APP_CLIENT_ID!,
    clientSecret: process.env.GITHUB_APP_CLIENT_SECRET!,
  },
});
