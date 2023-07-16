import { headers } from "next/headers";
import { frontend } from "../utils";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const return_to = searchParams.get("return_to");

  const { data: logoutFlow } = await frontend
    .createBrowserLogoutFlow({
      cookie: headers().get("cookie") || undefined,
      returnTo: return_to || undefined,
    })
    .catch(() => {
      redirect("/login");
    });

  return Response.redirect(logoutFlow.logout_url, 302);
}
