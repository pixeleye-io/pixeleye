import { API } from "@/libs";
import { RegisterSegment } from "../../breadcrumbStore";
import { cookies } from "next/headers";
import { getTeam } from "@/serverLibs";
import { RepoList } from "../repos";
import { redirect } from "next/navigation";
import { env } from "@/env";
import { Team } from "@pixeleye/api";

async function Repos({ team }: { team: Team; }) {

  const cookie = cookies().toString();


  const repos = await
    API.get("/v1/teams/{teamID}/repos", {
      params: {
        teamID: team.id,
      },
      headers: {
        cookie,
      },
    }).catch(async (err: Response) => {
      const body = await err.json();

      if (body?.code === "github:installation_suspended") {
        return 1;
      }

      console.log("test", err)
      return [];
    })


  if (repos === 1) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <p className="text-error">
          The GitHub App is currently suspended. Please go to github.com and unsuspend the app for this organization.
        </p>
      </div>
    );
  }

  return (<>
    <div className="max-w-4xl mx-auto mt-8">
      <p className="text-on-surface-variant">
        Not seeing your repo or organization?{" "}
        <a
          className="text-blue-400 dark:text-blue-300"
          href={`https://github.com/apps/${env.NEXT_PUBLIC_GITHUB_APP_NAME}/installations/new`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Install/configure
        </a>{" "}
        the Pixeleye GitHub App
      </p>
    </div>

    <RepoList repos={repos} team={team} source="github" /></>
  )
}

export default async function AddGithubProjectPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {

  if (!env.NEXT_PUBLIC_GITHUB_APP_NAME) return redirect("/add");

  const installation_id = searchParams.installation_id;

  const cookie = cookies().toString();

  if (installation_id) {
    const { team } = await API.post("/v1/git/github", {
      queries: {
        installation_id,
      },
      headers: {
        cookie,
      },
    });

    const params = new URLSearchParams(searchParams);
    params.delete("installation_id");
    params.delete("setup_action");
    params.set("team", team.id);

    redirect("/add/github?" + params.toString());
  }

  const team = await getTeam(searchParams);

  if (!team.hasInstall) {
    redirect(
      `https://github.com/apps/${env.NEXT_PUBLIC_GITHUB_APP_NAME}/installations/new`
    );
  }

  return (
    <>
      <RegisterSegment
        order={2}
        reference="github"
        teamId={team.id}
        segment={[
          {
            name: "Add project",
            value: `/add/github/${team.type !== "user" ? "?team=" + team.id : ""}`,
          },
          {
            name: "Github",
            value: `/add/github/${team.type !== "user" ? "?team=" + team.id : ""}`,
          },
        ]}
      />
      <Repos team={team} />
    </>
  );
}
