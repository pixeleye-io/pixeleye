import { API } from "@/libs";
import { RegisterSegment } from "../../breadcrumbStore";
import { cookies } from "next/headers";
import { getTeam } from "@/serverLibs";
import { RepoList } from "../repos";
import { Team } from "@pixeleye/api";
import { BitbucketServerConnectForm } from "./connect-form";

async function Repos({ team }: { team: Team }) {
  const cookie = cookies().toString();

  const repoPage = await API.get("/v1/teams/{teamID}/repos", {
    params: {
      teamID: team.id,
    },
    headers: {
      cookie,
    },
  }).catch(() => ({ repos: [], next: "" }));

  return <RepoList initialRepos={repoPage.repos} initialNext={repoPage.next} team={team} source="bitbucket_server" />;
}

export default async function AddBitbucketServerProjectPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const team = await getTeam(searchParams);

  return (
    <>
      <RegisterSegment
        order={2}
        reference="bitbucket_server"
        teamId={team.id}
        segment={[
          {
            name: "Add project",
            value: team.type !== "user" ? `/add/bitbucket_server/?team=${team.id}` : "/add",
          },
          {
            name: "Bitbucket Server",
            value: `/add/bitbucket_server/${team.type !== "user" ? "?team=" + team.id : ""}`,
          },
        ]}
      />
      {team.hasInstall ? <Repos team={team} /> : <BitbucketServerConnectForm />}
    </>
  );
}
