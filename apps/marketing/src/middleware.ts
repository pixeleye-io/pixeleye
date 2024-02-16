import { NextResponse } from "next/server";
import { oryEndpoint, Session } from "@pixeleye/auth";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const data = await fetch(oryEndpoint + "/sessions/whoami", {
    headers: {
      cookie: request.cookies
        .getAll()
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; "),
    },
  }).catch(() => undefined);


  const url = request.nextUrl.clone();

  if (data?.status !== 200) {
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  const session = (await data?.json()) as Session | undefined;

  if (!data || data.status >= 300 || data.status < 200 || !session) {
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  // Users logged in who are trying to access the homepage are redirected to the dashboard.
  url.pathname = "/dashboard";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/"],
};
