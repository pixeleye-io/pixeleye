import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { refreshToken } from "@octokit/oauth-methods";
import { prisma } from "@pixeleye/db";
import { DefaultSession, type NextAuthOptions } from "next-auth";
import Email from "next-auth/providers/email";
// import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";

/**
 * Module augmentation for `next-auth` types
 * Allows us to add custom properties to the `session` object
 * and keep type safety
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 **/
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure
 * adapters, providers, callbacks, etc.
 * @see https://next-auth.js.org/configuration/options
 **/
export const authOptions: NextAuthOptions = {
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // session.user.role = user.role; <-- put other properties on the session here
      }
      // console.log(user, session, token);

      const github = await prisma.account.findFirst({
        where: {
          userId: user.id,
          provider: "github",
        },
      });

      if (github?.expires_at && github.expires_at < Date.now() / 1000) {
        // If the access token has expired, try to refresh it
        try {
          const { data } = await refreshToken({
            clientType: "github-app",
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            refreshToken: github.refresh_token!,
          });

          console.log(data);

          await prisma.account.update({
            data: {
              access_token: data.access_token,
              expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
              refresh_token: data.refresh_token ?? github.refresh_token,
              refresh_token_expires_in:
                data.refresh_token_expires_in ??
                github.refresh_token_expires_in,
            },
            where: {
              provider_providerAccountId: {
                provider: "github",
                providerAccountId: github.providerAccountId,
              },
            },
          });
        } catch (error) {
          console.error("Error refreshing access token", error);
          // The error property will be used client-side to handle the refresh token error
          (session as any).error = "RefreshAccessTokenError";
        }
      }

      return session;
    },
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Email({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),

    /**
     * ...add more providers here
     *
     * Most other providers require a bit more work than the Github provider.
     * For example, the GitHub provider requires you to add the
     * `refresh_token_expires_in` field to the Account model. Refer to the
     * NextAuth.js docs for the provider you want to use. Example:
     * @see https://next-auth.js.org/providers/github
     **/
  ],
};
