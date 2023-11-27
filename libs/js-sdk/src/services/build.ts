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
      targetBuildID: parentBuild?.id,
      targetParentID: parentBuild?.id,
      parentBuildIDs: parentBuild ? [parentBuild.id] : undefined, // TODO - Actually get the parent build ids
    },
  });

  return build;
}

export async function linkSnapshotsToBuild(
  ctx: Context,
  build: Build,
  snapshots: PartialSnapshot[]
) {
  // TODO - build in a retry mechanism
  const api = getAPI(ctx);

  await api.post("/v1/client/builds/{id}/upload", {
    body: {
      snapshots,
    },
    params: {
      id: build.id,
    },
  });
}

export async function completeBuild(ctx: Context, build: Build) {
  // TODO - build in a retry mechanism
  const api = getAPI(ctx);

  return api.post("/v1/client/builds/{id}/complete", {
    params: {
      id: build.id,
    },
  });
}
