import { getEnvironment, Context } from "./getEnv";
import { API } from "@pixeleye/api";

/**
 * Get the parent builds of the current build
 *
 * Steps:
 * 1. Search for the branch name in the parent builds, if found, we need to verify it's in our history
 * 2. If not found, we send off a list of previous commits to the API in the hopes we can find a match
 * 3. No match found, user needs to intervene and create a patch build
 */
export function getParentBuild(ctx: Context) {
  const env = getEnvironment(ctx);

  API.get("/builds", {
    queries: {
      project_id: "env.name",
      branch: "env.branch",
    },
  });
}
