import { Context, getAPI } from "./context";
import { getEnvironment } from "./getEnv";
import { getParentShas } from "./git";

/**
 * Get the parent builds of the current build
 *
 * Steps:
 * 1. Search for the branch name in the parent builds, if found, we need to verify it's in our history
 * 2. If not found, we send off a list of previous commits to the API in the hopes we can find a match
 * 3. No match found, user needs to intervene and create a patch build
 */
export async function getParentBuild(ctx: Context) {
  // TODO - I need to handle pr's and find the base merge commit
  // TODO - Add the concept of a default branch to fallback on if we can't find a build
  const env = await getEnvironment(ctx);

  const shas = await getParentShas(128);
  const branch = env.branch;

  const api = getAPI(ctx);

  const builds = await api.get("/builds", {
    body: {
      shas,
    },
  });

  const build = builds.find((build) => shas.some((sha) => sha === build.sha));

  if (build) {
    return build;
  }

  const branchBuild = await api.get("/builds", {
    queries: {
      branch,
    },
  });

  if (branchBuild.length > 0) {
    return branchBuild[0];
  }

  return null;
}
