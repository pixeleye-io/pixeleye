import { getEnvironment, getParentShas } from "@pixeleye/cli-env";
import { APIType } from "../api";

/**
 * Get the parent builds of the current build
 *
 * Steps:
 * 1. Search for the branch name in the parent builds, if found, we need to verify it's in our history
 * 2. If not found, we send off a list of previous commits to the API in the hopes we can find a match
 * 3. No match found, user needs to intervene and create a patch build
 */
export async function getParentBuilds(api: APIType) {
  // TODO - this should return an array of builds
  const env = await getEnvironment();

  const shas = await getParentShas(128);
  const branch = env.branch;

  const builds = await api
    .post("/v1/client/builds/parents", {
      body: {
        shas,
        branch,
      },
    })
    .catch((err) => {
      if (err.status === 401) {
        throw new Error("Unauthorized, please check your token");
      }
    });

  return builds;
}

export async function createBuild(api: APIType) {
  const env = await getEnvironment();

  if (!env.branch) {
    throw new Error("No branch found");
  } else if (!env.commit) {
    throw new Error("No commit found");
  }

  const parents = await getParentBuilds(api) || [];

  const sameBranchParent = parents?.find(
    (build) => build.branch === env.branch
  );

  const build = api.post("/v1/client/builds/create", {
    body: {
      branch: env.branch,
      sha: env.commit,
      targetBuildID: (sameBranchParent || parents[0]).id, // TODO - We should get the target if we are on a PR
      parentIDs: parents?.map((build) => build.id),
    },
  });

  return build;
}
