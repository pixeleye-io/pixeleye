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

  const build = api.post("/builds/create", {
    body: {
      branch: env.branch,
      sha: env.commit,
      parentBuildID: parentBuild?.id,
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

  await api.post(`/builds/{id}/upload`, {
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

  return api.post(`/builds/{id}/complete`, {
    params: {
      id: build.id,
    },
  });
}
