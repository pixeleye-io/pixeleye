import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@pixeleye/db";
import { TokenSet, type DefaultSession, type NextAuthOptions } from "next-auth";
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
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id = user.id;
        // session.user.role = user.role; <-- put other properties on the session here
      }
      // console.log(user, session, token);

      const [github] = await prisma.account.findMany({
        where: { userId: user.id, provider: "github" },
      });

      if (github?.expires_at! < Date.now() / 1000) {
        // If the access token has expired, try to refresh it
        try {
          // https://accounts.google.com/.well-known/openid-configuration
          // We need the `token_endpoint`.
          const response = await fetch(
            "https://github.com/login/oauth/access_token",
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
              },
              body: new URLSearchParams({
                grant_type: "refresh_token",
                client_id: process.env.GITHUB_APP_CLIENT_ID!,
                client_secret: process.env.GITHUB_APP_CLIENT_SECRET!,
                refresh_token: github?.refresh_token!,
              }),
              method: "POST",
            },
          );

          const tokens: TokenSet = await response.json();

          if (!response.ok || tokens.error) throw tokens;

          await prisma.account.update({
            data: {
              access_token: tokens.access_token,
              expires_at: Date.now() / 1000 + (tokens as any).expires_in,
              refresh_token: tokens.refresh_token ?? github!.refresh_token,
            },
            where: {
              provider_providerAccountId: {
                provider: "github",
                providerAccountId: github!.providerAccountId,
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
      clientId: process.env.GITHUB_APP_CLIENT_ID!,
      clientSecret: process.env.GITHUB_APP_CLIENT_SECRET!,
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
