import API from "@pixeleye/api";
import { getParentBuild, getEnvironment } from "./environment";

export async function CreateBuild(projectToken: string) {
  const ctx = {
    env: process.env,
  };

  const env = getEnvironment(ctx);

  if (!env.branch) {
    throw new Error("No branch found");
  } else if (!env.sha) {
    throw new Error("No sha found");
  }

  const parentBuild = await getParentBuild(ctx);

  // TODO - We should detect if this is the first build to avoid requiring a parent build

  const build = API.post("/builds/create", {
    body: {
      branch: env.branch,
      sha: env.sha,
      author: env.author,
      message: env.message,
      title: env.title,
      parentBuildID: parentBuild?.id,
    },
    headers: {
      Authorization: `Bearer ${projectToken}`,
    },
  });

  return build;
}
