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
export async function getParentBuild(api: APIType) {
  // TODO - this should return an array of builds
  const env = await getEnvironment();

  const shas = await getParentShas(128);
  const branch = env.branch;

  const builds = await api.post("/v1/client/builds", {
    body: {
      shas,
    },
  });

  const build = builds.find((build) => shas.some((sha) => sha === build.sha));

  if (build) {
    return {
      targetParent: build,
      parents: builds,
    };
  }

  const branchBuild = await api.post("/v1/client/builds", {
    queries: {
      branch,
    },
  });

  if (branchBuild.length > 0) {
    return {
      targetParent: branchBuild[0],
      parents: builds,
    };
  }

  return null;
}

export async function createBuild(api: APIType) {
  const env = await getEnvironment();

  if (!env.branch) {
    throw new Error("No branch found");
  } else if (!env.commit) {
    throw new Error("No commit found");
  }

  const { targetParent, parents } = (await getParentBuild(api)) || {};

  const build = api.post("/v1/client/builds/create", {
    body: {
      branch: env.branch,
      sha: env.commit,
      targetBuildID: targetParent?.id, // TODO - We should get the target if we are on a PR
      targetParentID: targetParent?.id,
      parentBuildIDs: parents?.map((build) => build.id),
    },
  });

  return build;
}
