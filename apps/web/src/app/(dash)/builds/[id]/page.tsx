import { API } from "@/libs";
import { Reviewer } from "@pixeleye/reviewer";
import { cookies } from "next/headers";

export default async function ProjectOverviewPage({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const buildID = params.id;

  const [build, snapshots] = await Promise.all([
    API.get("/builds/{id}", {
      params: {
        id: buildID,
      },
      headers: {
        cookie: cookies().toString(),
      },
    }),
    await API.get("/builds/{id}/snapshots", {
      params: {
        id: buildID,
      },
      headers: {
        cookie: cookies().toString(),
      },
    }),
  ]);

  return <Reviewer build={build} snapshots={snapshots} />;
}
