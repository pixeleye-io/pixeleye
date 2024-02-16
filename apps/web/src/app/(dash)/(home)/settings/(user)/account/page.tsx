import { AuthNode, ErrorsList } from "@/app/(auth)/sharedComponents";
import { frontend, getUrlForFlow, isQuerySet } from "@pixeleye/auth";
import { getTeam } from "@/serverLibs";
import { filterNodesByGroups } from "@ory/integrations/ui";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SettingsTemplate } from "../../settingsTemplate";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const team = await getTeam(searchParams);

  // The flow is used to identify the settings and registration flow and
  // return data like the csrf_token and so on.
  if (!isQuerySet(searchParams.flow)) {
    redirect(getUrlForFlow("settings"));
  }

  if (team.type !== "user") {
    redirect(`/settings/org?team=${team.id}`);
  }

  const cookie = cookies().getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const flow = await frontend
    .getSettingsFlow({
      id: searchParams.flow.toString(),
      cookie,
    })
    .then(({ data }) => data);

  const socialNodes = filterNodesByGroups({
    nodes: flow.ui.nodes,
    groups: ["oidc"],
    withoutDefaultGroup: true,
  });

  const passwordNodes = filterNodesByGroups({
    nodes: flow.ui.nodes,
    groups: ["password"],
    withoutDefaultGroup: true,
  });

  const defaultNodes = filterNodesByGroups({
    nodes: flow.ui.nodes,
    groups: ["default"],
    withoutDefaultGroup: true,
  });

  const defaultComponents = defaultNodes.map((node, i) => {
    return <AuthNode fullButton={false} node={node} key={i} />;
  });

  console.log(socialNodes);

  return (
    <main>
      <ErrorsList messages={flow.ui.messages} />
      {passwordNodes.length > 0 && (
        <SettingsTemplate
          title="Password"
          description="Reset your password here"
        >
          <form
            className="space-y-4"
            action={flow.ui.action}
            method={flow.ui.method}
          >
            {defaultComponents}
            {passwordNodes.map((node, i) => {
              return <AuthNode fullButton={false} node={node} key={i} />;
            })}
          </form>
        </SettingsTemplate>
      )}
      {socialNodes.length > 0 && (
        <SettingsTemplate
          title="Social Login"
          description="Connect your social accounts here"
        >
          <form
            className="space-y-4"
            action={flow.ui.action}
            method={flow.ui.method}
          >
            {defaultComponents}
            {socialNodes.map((node, i) => {
              return <AuthNode fullButton={false} node={node} key={i} />;
            })}
          </form>
        </SettingsTemplate>
      )}
    </main>
  );
}
