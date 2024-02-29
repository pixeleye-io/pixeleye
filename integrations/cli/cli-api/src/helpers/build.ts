import { getEnvironment, getMergeBase, getParentShas } from "@pixeleye/cli-env";
import { logger } from "@pixeleye/cli-logger";
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
  const env = await getEnvironment();

  const shas = await getParentShas(128);
  const branch = env.branch;

  logger.debug(`Checking for parent builds for ${branch}`);
  logger.debug(`Parent SHAs: ${shas.join(", ")}`);

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

  if (builds && builds.length > 0) {
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
    if (!env.targetBranch) {
      throw new Error(
        "No PR branch name not found, please set the environment variable PIXELEYE_PR_BRANCH"
      );
    }

    const mergeBase = await getMergeBase(env.targetBranch).catch(
      () => undefined
    );

    if (mergeBase === undefined) {
      console.warn(
        `No merge base found for ${env.targetBranch}, we will attempt to use the latest build in that branch. This could mean we aren't accurately testing the changes in this PR.`
      );
    }

    // We Try to find a build that matches the merge base commit, and failing that just default to the latest build in that branch
    let mergeBaseBuild = await api.post("/v1/client/builds", {
      body: {
        shas: mergeBase ? [mergeBase] : undefined,
      },
      queries: {
        limit: 10,
        branch: mergeBase ? undefined : env.targetBranch,
      },
    });

    if (mergeBaseBuild.length === 0 && mergeBase) {
      mergeBaseBuild = await api.post("/v1/client/builds", {
        queries: {
          branch: env.targetBranch,
          limit: 1,
        },
      });
    }

    if (mergeBaseBuild.length === 0) {
      throw new Error(
        `No build found for ${env.targetBranch}, please run pixeleye on that branch first`
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
      targetBranch: env.targetBranch,
      prID: env.prID,
      title: env.title,
    },
  });

  return build;
}
