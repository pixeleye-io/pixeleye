import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getUrlForFlow, isQuerySet, frontend } from "@pixeleye/auth";
import { AuthNode } from "../sharedComponents";

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { flow, return_to = "", code } = searchParams;

  if (!isQuerySet(flow)) {
    const initFlowUrl = getUrlForFlow(
      "verification",
      new URLSearchParams({
        return_to: return_to.toString(),
      })
    );

    redirect(initFlowUrl);
  }

  const { data: verificationFlow } = await frontend.getVerificationFlow({
    id: flow,
    cookie: headers().get("cookie") || undefined,
  });

  if (verificationFlow.ui.messages && verificationFlow.ui.messages.length > 0) {
    if (verificationFlow.ui.messages.some(({ id }) => id === 1080002)) {
      redirect("/");
    }
  }

  console.log(verificationFlow.ui.nodes);

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold leading-9 tracking-tight text-on-surface">
          Verify your email
        </h2>
        <p className="mt-2 text-sm leading-6 text-on-surface">
          We have sent a code to your email address
        </p>
      </div>

      <form
        action={verificationFlow.ui.action}
        method={verificationFlow.ui.method}
        className="space-y-6 mt-10"
      >
        {verificationFlow.ui.nodes.map((node, i) => {
          if ((node.attributes as any).name === "code") {
            (node.attributes as any).value = code;
          }
          return <AuthNode node={node} key={i} />;
        })}
      </form>
    </>
  );
}
