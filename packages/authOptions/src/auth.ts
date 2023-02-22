import { prisma } from "@pixeleye/db";
import { getUserOctokit } from "@pixeleye/github";
import { serverApi } from "@pixeleye/server-utils";
import { AuthOptions } from "next-auth";

const options: AuthOptions["events"] = {
  createUser: async ({ user }) => {
    // Create a personal team for the user
    await prisma.userOnTeam.create({
      data: {
        team: {
          create: {
            name: user.name || "Your Team",
            type: "USER",
          },
        },
        user: {
          connect: {
            id: user.id,
          },
        },
        role: "OWNER",
      },
    });
  },
  linkAccount: async ({ account, user }) => {
    // There could already be a github app installed on the user's account
    // If so, connect the team to the github app
    if (account.provider === "github" && account.providerAccountId) {
      const userOctokit = await getUserOctokit({
        refreshToken: account.refresh_token!,
        refreshTokenExpiresAt: account.refresh_token_expires_in!.toString(),
        token: account.access_token!,
        expiresAt: account.expires_at!.toString(),
      });

      // Get all installations for the user
      let page = 1;
      const perPage = 30;
      const installs: number[] = [];
      while (true) {
        const availableInstallations = await userOctokit.request(
          "GET /user/installations",
          {
            per_page: perPage,
            page,
          },
        );
        for (const installation of availableInstallations.data.installations) {
          if (installation.app_id.toString() === process.env.GITHUB_APP_ID) {
            installs.push(installation.id);
          }
        }

        if (availableInstallations.data.total_count < page * perPage) break;
        page++;
      }

      await Promise.all(
        installs.map((installationId) =>
          serverApi(null).github.updateInstallation({
            installationId,
          }),
        ),
      );
    }
  },
};

export default options;
