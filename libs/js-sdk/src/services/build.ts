import { Build, PartialSnapshot } from "@pixeleye/api";
import {
  getParentBuild,
  getEnvironment,
  getAPI,
  Context,
} from "../environment";

// Creates a pixeleye build
// We can then upload snapshots to this build
export async function createBuild(ctx: Context) {
  // TODO - build in a retry mechanism

  const api = getAPI(ctx);

  const env = await getEnvironment(ctx);

  if (!env.branch) {
    throw new Error("No branch found");
  } else if (!env.commit) {
    throw new Error("No commit found");
  }

  const parentBuild = await getParentBuild(ctx);

  const build = api.post("/v1/client/builds/create", {
    body: {
      branch: env.branch,
      sha: env.commit,
      targetBuildID: parentBuild?.id, // TODO - We should get the target if we are on a PR
      targetParentID: parentBuild?.id,
      parentBuildIDs: parentBuild ? [parentBuild.id] : undefined, // TODO - Actually get the parent build ids
    },
  });

  return build;
}

export async function linkSnapshotsToBuild(
  ctx: Context,
  buildID: Build["id"],
  snapshots: PartialSnapshot[]
) {
  // TODO - build in a retry mechanism
  const api = getAPI(ctx);

  await api.post("/v1/client/builds/{id}/upload", {
    body: {
      snapshots,
    },
    params: {
      id: buildID,
    },
  });
}

export async function completeBuild(ctx: Context, buildID: Build["id"]) {
  // TODO - build in a retry mechanism
  const api = getAPI(ctx);

  return api.post("/v1/client/builds/{id}/complete", {
    params: {
      id: buildID,
    },
  });
}

export async function abortBuild(ctx: Context, buildID: Build["id"]) {
  const api = getAPI(ctx);

  return api.post("/v1/client/builds/{id}/abort", {
    params: {
      id: buildID,
    },
  });
}
