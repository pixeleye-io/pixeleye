import { Link } from "@pixeleye/ui";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getUrlForFlow, isQuerySet, frontend } from "../utils";
import { filterNodesByGroups } from "@ory/integrations/ui";
import { AuthNode, ErrorsList } from "../sharedComponents";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { flow, aal = "", refresh = "", return_to = "" } = searchParams;

  const initFlowQuery = new URLSearchParams({
    aal: aal.toString(),
    refresh: refresh.toString(),
    return_to: return_to.toString(),
  });

  const initFlowUrl = getUrlForFlow("login", initFlowQuery);

  // The flow is used to identify the settings and registration flow and
  // return data like the csrf_token and so on.
  if (!isQuerySet(flow)) {
    redirect(initFlowUrl);
  }

  const { data: loginFlow } = await frontend.getLoginFlow({
    id: flow,
    cookie: headers().get("cookie") || undefined,
  });

  // We need to redirect users to the verification page if not verified.
  if (loginFlow.ui.messages && loginFlow.ui.messages.length > 0) {
    if (loginFlow.ui.messages.some(({ id }) => id === 4000010)) {
      const { data: verificationFlow } =
        await frontend.createBrowserVerificationFlow({
          returnTo:
            (return_to && return_to.toString()) || loginFlow.return_to || "",
        });

      const verificationParameters = new URLSearchParams({
        flow: verificationFlow.id,
        message: JSON.stringify(loginFlow.ui.messages),
      });
      redirect(`/verification?${verificationParameters.toString()}`);
    } else {
      console.log(loginFlow.ui.messages);
    }
  }

  const initRegistrationQuery = new URLSearchParams({
    ...((return_to?.toString() || loginFlow.return_to) && {
      return_to: return_to.toString() || loginFlow.return_to,
    }),
  });
  if (loginFlow.oauth2_login_request?.challenge) {
    initRegistrationQuery.set(
      "login_challenge",
      loginFlow.oauth2_login_request.challenge
    );
  }

  //TODO - this page can also be used to verify the users credentials so sign in should be changed to sign in or verify

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold leading-9 tracking-tight text-on-surface">
          Sign in
        </h2>
        <p className="mt-2 text-sm leading-6 text-on-surface">
          Not a member?{" "}
          <Link href={`/registration?${initRegistrationQuery.toString()}`}>
            Sign up for an account
          </Link>
        </p>
      </div>

      <ErrorsList className="mt-4" messages={loginFlow.ui.messages} />

      <form
        className="mt-10"
        action={loginFlow.ui.action}
        method={loginFlow.ui.method}
      >
        {filterNodesByGroups({
          nodes: loginFlow.ui.nodes,
          withoutDefaultGroup: true,
          groups: ["oidc"],
        }).map((node, i) => (
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

      <form
        action={loginFlow.ui.action}
        method={loginFlow.ui.method}
        className="space-y-6"
      >
        {filterNodesByGroups({
          nodes: loginFlow.ui.nodes,
          groups: ["password"],
        }).map((node, i) => (
          <AuthNode node={node} key={i} />
        ))}
      </form>
    </>
  );
}
