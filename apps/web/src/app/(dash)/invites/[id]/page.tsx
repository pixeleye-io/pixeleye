import { cookies } from "next/headers";
import { API } from "@/libs";
import { Divider } from "@pixeleye/ui";
import { InviteCard } from "./inviteCard";
import { RegisterSegment } from "../../breadcrumbStore";

export default async function ProjectInvitePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const projectId = params.id;

  const teamID = searchParams.team as string | undefined;

  const cookie = cookies().toString();

  const invite = await API.get("/invites/{id}", {
    params: {
      id: projectId,
    },
    headers: {
      cookie,
    },
  });

  return (
    <>
      <Divider />
      <RegisterSegment
        order={1}
        reference="invites"
        segment={[
          {
            name: "Invites",
            value: `/invites/${invite.id}${teamID ? `?team=${teamID}` : ""}`,
          },
          {
            name: `${invite.projectName}`,
            value: `/invites/${invite.id}${teamID ? `?team=${teamID}` : ""}`,
          },
        ]}
        teamId={teamID}
      />
      <InviteCard invite={invite} />
    </>
  );
}
