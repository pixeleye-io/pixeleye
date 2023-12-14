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
  const env = await getEnvironment();

  const shas = await getParentShas(128);
  const branch = env.branch;

  const builds = await api
    .post("/v1/client/builds", {
      body: {
        shas,
      },
    })
    .catch((err) => {
      if (err.status === 401) {
        throw new Error("Unauthorized, please check your token");
      }
    });

  const build = builds!.find((build) => shas.some((sha) => sha === build.sha));

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

async function getTargetBuild(api: APIType) {
  const env = await getEnvironment();

  if (!env.targetBranch) {
    throw new Error("No target branch found");
  } else if (!env.targetCommit) {
    throw new Error("No target commit found");
  }

  const builds = await api
    .post("/v1/client/builds", {
      body: {
        shas: [env.targetCommit],
      },
    })
    .catch((err) => {
      if (err.status === 401) {
        throw new Error("Unauthorized, please check your token");
      }
    });

  const build = builds?.[0];

  if (build) {
    return build;
  }

  // TODO - we should add a limit search query to this API
  const branchBuild = await api.post("/v1/client/builds", {
    queries: {
      branch: env.targetBranch,
    },
  });

  return branchBuild[0];
}

export async function createBuild(api: APIType) {
  const env = await getEnvironment();

  if (!env.branch) {
    throw new Error("No branch found");
  } else if (!env.commit) {
    throw new Error("No commit found");
  }

  const { targetParent } = (await getParentBuild(api)) || {};
  

  let targetBuildID = targetParent?.id;
  if (env.isPR) {
    const targetBuild = await getTargetBuild(api);
    targetBuildID = targetBuild.id;
  }

  const build = api.post("/v1/client/builds/create", {
    body: {
      branch: env.branch,
      sha: env.commit,
      targetBuildID,
      targetParentID: targetParent?.id,
    },
  });

  return build;
}
