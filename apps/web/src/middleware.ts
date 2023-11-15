import { NextResponse } from "next/server";
import { apiBaseUrl } from "./app/(auth)/utils";
import type { NextRequest } from "next/server";
import { Session } from "@ory/kratos-client";

// Anyone not logged in is redirected to the login page.

export async function middleware(request: NextRequest) {
  const data = await fetch(apiBaseUrl + "/sessions/whoami", {
    headers: {
      cookie: request.cookies.toString(),
    },
    next: {
      revalidate: 0,
    },
  }).catch(() => null);


  const session = (await data?.json()) as Session | undefined;

  if (!data || data.status >= 300 || data.status < 200 || !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
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
