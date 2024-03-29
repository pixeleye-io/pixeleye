import { Link } from "@pixeleye/ui";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getUrlForFlow, isQuerySet, frontend } from "@pixeleye/auth";
import { filterNodesByGroups } from "@ory/integrations/ui";
import { AuthNode, ErrorsList } from "../sharedComponents";

export default async function RegistrationPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { flow, return_to, after_verification_return_to, login_challenge } =
    searchParams;

  const initFlowQuery = new URLSearchParams({
    ...(return_to && { return_to: return_to.toString() }),
    ...(after_verification_return_to && {
      after_verification_return_to: after_verification_return_to.toString(),
    }),
  });

  if (isQuerySet(login_challenge)) {
    initFlowQuery.append("login_challenge", login_challenge);
  }

  const initFlowUrl = getUrlForFlow("registration", initFlowQuery);

  // The flow is used to identify the settings and registration flow and
  // return data like the csrf_token and so on.
  if (!isQuerySet(flow)) {
    redirect(initFlowUrl);
  }

  const { data: loginFlow } = await frontend.getRegistrationFlow({
    id: flow,
    cookie: headers().get("cookie") || undefined,
  });

  const initLoginQuery = new URLSearchParams({
    ...((return_to?.toString() || loginFlow.return_to) && {
      return_to: return_to?.toString() || loginFlow.return_to,
    }),
  });
  if (loginFlow.oauth2_login_request?.challenge) {
    initLoginQuery.set(
      "login_challenge",
      loginFlow.oauth2_login_request.challenge
    );
  }

  const oidcNodes = filterNodesByGroups({
    nodes: loginFlow.ui.nodes,
    withoutDefaultGroup: true,
    groups: ["oidc"],
  })

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold leading-9 tracking-tight text-on-surface">
          Create an account
        </h2>
        <p className="mt-2 text-sm leading-6 text-on-surface">
          Already a member?{" "}
          <Link href={`/login?${initLoginQuery.toString()}`}>Login</Link>
        </p>
      </div>

      <ErrorsList className="mt-4" messages={loginFlow.ui.messages} />

      {oidcNodes.length > 0 && (<>
        <form
          className="mt-10"
          action={loginFlow.ui.action}
          method={loginFlow.ui.method}
        >
          {oidcNodes.map((node, i) => (
            <AuthNode node={node} key={i} />
          ))}
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm font-medium leading-6">
            <span className="px-6 bg-surface text-on-surface">
              Or continue with
            </span>
          </div>
        </div>
      </>)}


      <form
        action={loginFlow.ui.action}
        method={loginFlow.ui.method}
        className="space-y-6"
      >
        {filterNodesByGroups({
          nodes: loginFlow.ui.nodes,
          groups: ["password"],
        })
          .filter((node) =>
            ["method", "password", "traits.email", "csrf_token"].includes(
              (node.attributes as any).name
            )
          )
          .map((node, i) => (
            <AuthNode node={node} key={i} />
          ))}
      </form>
    </>
  );
}
