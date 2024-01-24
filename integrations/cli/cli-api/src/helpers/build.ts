import { getEnvironment, getParentShas, isAncestor } from "@pixeleye/cli-env";
import { APIType } from "../api";
import { Build } from "@pixeleye/api";


export const filterDependantBuilds = async (builds: Build[]) => {
  if (builds.length === 0) {
    return [];
  }

  let filteredBuilds: Build[] = [builds[0]];
  for (const build of builds.slice(1)) {
    filteredBuilds = filteredBuilds.filter(async (filteredBuild) => {
      if (build.sha === filteredBuild.sha) {
        if (build.buildNumber > filteredBuild.buildNumber) {
          return false;
        }
      } else if (await isAncestor(filteredBuild.sha, build.sha)) {
        return false;
      }

      return true;
    });

    if (
      filteredBuilds.every((filteredBuild) => build.sha !== filteredBuild.sha)
    ) {
      if (
        filteredBuilds.every(
          (filteredBuild) => !isAncestor(build.sha, filteredBuild.sha)
        )
      ) {
        filteredBuilds.push(build);
      }
    } else if (
      filteredBuilds.every(
        (filteredBuild) =>
          build.sha !== filteredBuild.sha ||
          (build.sha === filteredBuild.sha &&
            build.buildNumber > filteredBuild.buildNumber)
      )
    ) {
      filteredBuilds.push(build);
    }
  }

  return filteredBuilds;
};

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

  if (builds) {
    return builds;
  }

  const branchBuild = await api.post("/v1/client/builds", {
    queries: {
      branch,
    },
  });

  if (branchBuild.length > 0) {
    return builds;
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

  const filteredParentBuilds = await filterDependantBuilds(parentBuilds);

  console.log({
    parentBuilds,
    filteredParentBuilds,
  });

  const build = api.post("/v1/client/builds/create", {
    body: {
      branch: env.branch,
      sha: env.commit,
      targetBuildIDs: filteredParentBuilds?.map((build) => build.id), // TODO - We should get the target if we are on a PR
      parentIDs: filteredParentBuilds?.map((build) => build.id),
    },
  });

  return build;
}
