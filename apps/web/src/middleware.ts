import { NextResponse } from "next/server";
import { oryEndpoint } from "@pixeleye/auth";
import type { NextRequest } from "next/server";
import { Session } from "@ory/kratos-client";
import { env } from "./env";

// Bit of a hack to redirect self-hosted docker users to the correct backend URL.
function handleSelfHostedRewrites(request: NextRequest) {
  if (env.NEXT_PUBLIC_PIXELEYE_HOSTING === "true" || !env.BACKEND_URL) return;

  const url = request.nextUrl.clone();
  if (!url.pathname.startsWith("/api")) return;

  const newURL = new URL(env.BACKEND_URL);

  newURL.pathname = url.pathname.replace("/api", "");

  return NextResponse.rewrite(newURL, {
    request,
  });
}

// Anyone not logged in is redirected to the login page.

export async function middleware(request: NextRequest) {
  const res = handleSelfHostedRewrites(request);
  if (res) return res;

  const data = await fetch(oryEndpoint + "/sessions/whoami", {
    headers: {
      cookie: request.cookies
        .getAll()
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; "),
    },
  }).catch(() => undefined);

  const url = request.nextUrl.clone();

  const session = (await data?.json()) as Session | undefined;

  if (!data || data.status >= 300 || data.status < 200 || !session) {
    if (request.nextUrl.pathname === "/") {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    url.pathname = "/logout"; // Some cases people still have a session but are not logged in. This is a workaround.
    url.searchParams.set("return_to", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname === "/") {
    // Users logged in who are trying to access the homepage are redirected to the dashboard.
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    "/",
    "/billing/:path*",
    "/dashboard/:path*",
    "/builds/:path*",
    "/add/:path*",
    "/projects/:path*",
    "/settings/:path*",
    "/usage/:path*",
    "/invites/:path*",
    "/api/:path*",
  ],
};
