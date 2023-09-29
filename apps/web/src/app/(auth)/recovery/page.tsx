import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getUrlForFlow, isQuerySet, frontend } from "../utils";
import { AuthNode } from "../sharedComponents";

export default async function RecoveryPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { flow, return_to = "", code } = searchParams;

  if (!isQuerySet(flow)) {
    const initFlowUrl = getUrlForFlow(
      "recovery",
      new URLSearchParams({
        return_to: return_to.toString(),
      })
    );

    redirect(initFlowUrl);
  }

  const { data: recoveryFlow } = await frontend.getRecoveryFlow({
    id: flow,
    cookie: headers().get("cookie") || undefined,
  });

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold leading-9 tracking-tight text-on-surface">
          Forgotten your password?
        </h2>
        <p className="mt-2 text-sm leading-6 text-on-surface">
          We&apos;ll send you a code to reset your password
        </p>
      </div>

      <form
        action={recoveryFlow.ui.action}
        method={recoveryFlow.ui.method}
        className="space-y-6 mt-10"
      >
        {recoveryFlow.ui.nodes.map((node, i) => {
          if ((node.attributes as any).name === "code") {
            (node.attributes as any).value = code;
          }
          return <AuthNode node={node} key={i} />;
        })}
      </form>
    </>
  );
}
