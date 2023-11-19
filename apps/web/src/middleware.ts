import { NextResponse } from "next/server";
import { oryEndpoint } from "./app/(auth)/utils";
import type { NextRequest } from "next/server";
import { Session } from "@ory/kratos-client";

// Anyone not logged in is redirected to the login page.

export async function middleware(request: NextRequest) {
  const data = await fetch(oryEndpoint + "/sessions/whoami", {
    headers: {
      cookie: request.cookies.toString(),
    },
  }).catch(() => null);

  const session = (await data?.json()) as Session | undefined;

  if (!data || data.status >= 300 || data.status < 200 || !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/logout"; // Some cases people still have a session but are not logged in. This is a workaround.
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/builds/:path*",
    "/add/:path*",
    "/projects/:path*",
    "/settings/:path*",
    "/usage/:path*",
    "/invites/:path*",
  ],
};
