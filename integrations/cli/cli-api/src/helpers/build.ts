import {
  getEnvironment,
  getMergeBase,
  getParentShas,
  isAncestor,
} from "@pixeleye/cli-env";
import { APIType } from "../api";

import { Build } from "@pixeleye/api";

async function noAncestors(build: Build, builds: Build[]) {
  for (const ancestor of builds) {
    if (await isAncestor(build.sha, ancestor.sha)) {
      return false;
    }
  }
  return true;
}

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
    .post("/v1/client/latestBuilds", {
      body: {
        shas,
      },
    })
    .catch((err) => {
      if (err.status === 401) {
        throw new Error("Unauthorized, please check your token");
      }
    });

  if (builds) {
    return builds;
  }

  const branchBuild = await api.post("/v1/client/builds", {
    queries: {
      branch,
    },
  });

  if (branchBuild.length > 0) {
    return [branchBuild[0]];
  }

  return [];
}

export async function createBuild(api: APIType) {
  const env = await getEnvironment();

  if (!env.branch) {
    throw new Error("No branch found");
  } else if (!env.commit) {
    throw new Error("No commit found");
  }

  const parentBuilds = (await getParentBuilds(api)) || [];

  let targetBuildIDs = [];

  if (env.isPR) {
    if (!env.prBranch) {
      throw new Error(
        "No PR branch name not found, please set the environment variable PIXELEYE_PR_BRANCH"
      );
    }

    const mergeBase = await getMergeBase(env.prBranch).catch(() => undefined);

    if (mergeBase === undefined) {
      console.warn(
        `No merge base found for ${env.prBranch}, we will attempt to use the latest build in that branch. This could mean we aren't accurately testing the changes in this PR.`
      );
    }

    // We Try to find a build that matches the merge base commit, and failing that just default to the latest build in that branch
    let mergeBaseBuild = await api.post("/v1/client/builds", {
      body: {
        shas: mergeBase ? [mergeBase] : undefined,
      },
      queries: {
        branch: mergeBase ? undefined : env.prBranch,
        limit: 1,
      },
    });

    if (mergeBaseBuild.length === 0 && mergeBase) {
      mergeBaseBuild = await api.post("/v1/client/builds", {
        queries: {
          branch: env.prBranch,
          limit: 1,
        },
      });
    }

    if (mergeBaseBuild.length === 0) {
      throw new Error(
        `No build found for ${env.prBranch}, please run pixeleye on that branch first`
      );
    }

    targetBuildIDs = mergeBaseBuild.map((build) => build.id);
  } else {
    targetBuildIDs = parentBuilds?.map((build) => build.id);
  }

  const build = api.post("/v1/client/builds/create", {
    body: {
      branch: env.branch,
      sha: env.commit,
      targetBuildIDs,
      parentIDs: parentBuilds?.map((build) => build.id),
    },
  });

  return build;
}
