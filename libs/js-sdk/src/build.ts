import API from "@pixeleye/api";
import { getParentBuild, getEnvironment } from "./environment";

export async function CreateBuild(projectToken: string) {
  const ctx = {
    env: process.env,
    variables: {},
    endpoint: "http://localhost:5000/v1",
  };

  const env = await getEnvironment(ctx);

  if (!env.branch) {
    throw new Error("No branch found");
  } else if (!env.commit) {
    throw new Error("No commit found");
  }

  const parentBuild = await getParentBuild(ctx);

  // TODO - We should detect if this is the first build to avoid requiring a parent build

  const build = API.post("/builds/create", {
    body: {
      branch: env.branch,
      sha: env.commit,
      parentBuildID: parentBuild?.id,
    },
    headers: {
      Authorization: `Bearer ${projectToken}`,
    },
  });

  return build;
}
