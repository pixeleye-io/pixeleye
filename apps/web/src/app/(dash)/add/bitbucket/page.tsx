import { API } from "@/libs";
import { RegisterSegment } from "../../breadcrumbStore";
import { cookies } from "next/headers";
import { getTeam } from "@/serverLibs";
import { RepoList } from "../repos";
import { redirect } from "next/navigation";
import { env, BACKEND_URL } from "@/env";
import { Team } from "@pixeleye/api";

async function Repos({ team }: { team: Team; }) {

  const cookie = cookies().toString();

  const repoPage = await
    API.get("/v1/teams/{teamID}/repos", {
      params: {
        teamID: team.id,
      },
      headers: {
        cookie,
      },
    }).catch(() => ({ repos: [], next: "" }))

  return (<>
    <div className="max-w-4xl mx-auto mt-8">
      <p className="text-on-surface-variant">
        Not seeing your repo or workspace?{" "}
        <a
          className="text-blue-400 dark:text-blue-300"
          href={`${BACKEND_URL}/v1/git/bitbucket`}
        >
          Connect another workspace
        </a>
      </p>
    </div>

    <RepoList initialRepos={repoPage.repos} initialNext={repoPage.next} team={team} source="bitbucket" /></>
  )
}

export default async function AddBitbucketProjectPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {

  if (!env.NEXT_PUBLIC_BITBUCKET_OAUTH_CLIENT_ID) return redirect("/add");

  const team = await getTeam(searchParams);

  if (!team.hasInstall) {
    redirect(`${BACKEND_URL}/v1/git/bitbucket`);
  }

  return (
    <>
      <RegisterSegment
        order={2}
        reference="bitbucket"
        teamId={team.id}
        segment={[
          {
            name: "Add project",
            value: team.type !== "user" ? `/add/bitbucket/?team=${team.id}` : "/add",
          },
          {
            name: "Bitbucket",
            value: `/add/bitbucket/${team.type !== "user" ? "?team=" + team.id : ""}`,
          },
        ]}
      />
      <Repos team={team} />
    </>
  );
}
