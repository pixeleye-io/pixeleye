import { API, useTeam } from "@/libs";
import { RegisterSegment } from "../../breadcrumbStore";
import { cookies } from "next/headers";
import { getTeam } from "@/serverLibs";
import { RepoList } from "../repos";
import { DataTable } from "@pixeleye/ui";
import { redirect } from "next/navigation";
import { columns } from "../columns";

export default async function AddGithubProjectPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const installation_id = searchParams.installation_id;

  const cookie = cookies().toString();

  if (installation_id) {
    const install = await API.post("/git/github", {
      queries: {
        installation_id,
      },
      headers: {
        cookie,
      },
    });

    // redirect("/add/github");
  }

  const team = await getTeam(searchParams);

  const repos = await API.get("/teams/{teamID}/repos", {
    params: {
      teamID: team.id,
    },
    headers: {
      cookie,
    },
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
      <RepoList repos={repos} />
      {/* <div className="container mx-auto py-10">
        <DataTable columns={columns} data={repos} />
      </div> */}
    </>
  );
}
