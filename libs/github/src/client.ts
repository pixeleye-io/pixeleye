// import { App } from "@octokit/app";
// import { createAppAuth } from "@octokit/auth-app";

// import { env } from "./env";

// const app = new App({
//   appId: env.GITHUB_APP_ID,
//   privateKey: env.GITHUB_PRIVATE_KEY,
//   oauth: {
//     clientId: env.GITHUB_APP_CLIENT_ID,
//     clientSecret: env.GITHUB_APP_CLIENT_SECRET,
//   },
// });

// app.eachInstallation

// app.octokit.auth({});

// const userAuth = createAppAuth({
//   appId: env.GITHUB_APP_ID,
//   privateKey: env.GITHUB_PRIVATE_KEY,
//   clientId: env.GITHUB_APP_CLIENT_ID,
//   clientSecret: env.GITHUB_APP_CLIENT_SECRET,
// });

// export const getOctokit = (installationId: number) =>
//   app.getInstallationOctokit(installationId);

// export const getUesr = (userName: string) =>
//   app.octokit.request("GET /users/{username}/installation", {
//     username: userName,
//   });
// export const getUserOctokit = (options: {
//   refreshToken: string;
//   refreshTokenExpiresAt: string;
//   token: string;
//   expiresAt: string;
// }) => app.oauth.getUserOctokit(options);

// export const getUser = (id: number) => userAuth({ type: "oauth-app" });

// export const getRepos = (userName: string) =>
//   app.octokit.request(
//     "GET /user/installations/{installation_id}/repositories",
//     {
//       installation_id: Number(env.GITHUB_APP_ID),
//     }
//   );

// export const userConnected = (userName: string) =>
//   app.octokit.request("GET /users/{username}/installation", {
//     username: userName,
//   });

// export const eachInstallation = app.eachInstallation;
