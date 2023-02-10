/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */

import { refreshToken } from "@octokit/oauth-methods";
import { getServerSession, type Session } from "@pixeleye/auth";
import { prisma } from "@pixeleye/db";
import { getUserOctokit } from "@pixeleye/github";
import { TRPCError, initTRPC } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API
 *
 * These allow you to access things like the database, the session, etc, when
 * processing a request
 *
 */
type CreateContextOptions = {
  session: Session | null;
};

/**
 * This helper generates the "internals" for a tRPC context. If you need to use
 * it, you can export it from here
 *
 * Examples of things you may need it for:
 * - testing, so we dont have to mock Next.js' req/res
 * - trpc's `createSSGHelpers` where we don't have req/res
 * @see https://create.t3.gg/en/usage/trpc#-servertrpccontextts
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  };
};

/**
 * This is the actual context you'll use in your router. It will be used to
 * process every request that goes through your tRPC endpoint
 * @link https://trpc.io/docs/context
 */
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Get the session from the server using the unstable_getServerSession wrapper function
  const session = await getServerSession({ req, res });

  return createInnerTRPCContext({
    session,
  });
};

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure;

/**
 * Reusable middleware that enforces users are logged in before running the
 * procedure
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Protected (authed) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use
 * this. It verifies the session is valid and guarantees ctx.session.user is not
 * null
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const enforceUserIsAuthedGithub = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const githubAccount = await ctx.prisma.account.findFirst({
    where: {
      userId: ctx.session.user.id,
      provider: "github",
    },
  });

  if (!githubAccount) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // if (githubAccount.expires_at! < Date.now() / 1000) {
  //   await refreshGitHubAccessToken(
  //     ctx.session.user.id,
  //     githubAccount.refresh_token!,
  //   );
  // }

  const userOctokit = await getUserOctokit({
    refreshToken: githubAccount.refresh_token!,
    refreshTokenExpiresAt: githubAccount.refresh_token_expires_in!.toString(),
    token: githubAccount.access_token!,
    expiresAt: githubAccount.expires_at!.toString(),
  });

  return next({
    ctx: {
      userOctokit,
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedureGithub = t.procedure.use(
  enforceUserIsAuthedGithub,
);

const refreshGitHubAccessToken = async (
  userId: string,
  refresh_token: string,
) => {
  const params = new URLSearchParams({
    refresh_token,
    grant_type: "refresh_token",
    client_id: process.env.GITHUB_APP_CLIENT_ID!,
    client_secret: process.env.GITHUB_APP_CLIENT_SECRET!,
  });
  try {
    const response = await fetch(
      `https://github.com/login/oauth/access_token?${params}`,
      {
        headers: {
          Accept: "application/json",
        },
        method: "POST",
      },
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error_description);
    }

    const accessTokenExpires = Date.now() / 1000 + data.expires_in; // seconds

    await prisma.account.updateMany({
      where: {
        userId,
      },
      data: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        refresh_token_expires_in: data.refresh_token_expires_in,
        expires_at: accessTokenExpires,
        token_type: data.token_type,
        scope: data.scope,
      },
    });

    return accessTokenExpires;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.message);
  }
};
