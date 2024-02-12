import { NextResponse } from "next/server";
import { oryEndpoint } from "@pixeleye/auth";
import type { NextRequest } from "next/server";
import { Session } from "@ory/kratos-client";

// Anyone not logged in is redirected to the login page.

export async function middleware(request: NextRequest) {
  const data = await fetch(oryEndpoint + "/sessions/whoami", {
    headers: {
      cookie: request.cookies.toString(),
    },
  }).catch(() => null);

  const url = request.nextUrl.clone();

  if (data?.status !== 200) {
    return NextResponse.redirect(url + "/logout");
  }

  const session = (await data?.json()) as Session | undefined;

  if (!data || data.status >= 300 || data.status < 200 || !session) {
    if (request.nextUrl.pathname === "/") {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    url.pathname = "/logout"; // Some cases people still have a session but are not logged in. This is a workaround.
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
  ],
};
