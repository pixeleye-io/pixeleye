import { API } from "@/libs";
import { RegisterSegment } from "../../breadcrumbStore";
import { cookies } from "next/headers";
import { getTeam } from "@/serverLibs";
import { RepoList } from "../repos";
import { redirect } from "next/navigation";
import { env } from "@/env";

export default async function AddGithubProjectPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const installation_id = searchParams.installation_id;

  const cookie = cookies().toString();

  if (searchParams.setup_action === "update") {
    const params = new URLSearchParams(searchParams);
    params.delete("installation_id");
    params.delete("setup_action");

    redirect("/add/github");
  }

  if (installation_id) {
    const { team } = await API.post("/git/github", {
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

  const [repos, projects] = await Promise.all([
    API.get("/teams/{teamID}/repos", {
      params: {
        teamID: team.id,
      },
      headers: {
        cookie,
      },
    }),
    API.get("/teams/{teamID}/projects", {
      params: {
        teamID: team.id,
      },
      headers: {
        cookie,
      },
    }),
  ]);

  const filteredRepos = repos.filter((repo) => {
    return !projects.some((project) => project.sourceID === repo.id);
  });

  return (
    <>
      <RegisterSegment
        order={2}
        reference="github"
        segment={{
          name: "github",
          value: "/add/github",
        }}
      />
      <div className="max-w-4xl mx-auto mt-8">
        <p className="text-on-surface-variant">
          Not seeing your repo or organization?{" "}
          <a
            className="text-blue-400 dark:text-blue-300"
            href={`https://github.com/apps/${env.GITHUB_APP_NAME}/installations/new`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Install/configure
          </a>{" "}
          the Pixeleye GitHub App
        </p>
      </div>

      <RepoList repos={filteredRepos} team={team} source="github" />
    </>
  );
}
