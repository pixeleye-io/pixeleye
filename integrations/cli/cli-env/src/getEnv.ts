/* eslint-disable turbo/no-undeclared-env-vars */
import envCi from "env-ci";
import { getBranch, getCommit, getMergeBase } from "./git";

export interface Environment {
  name?: string;
  commit?: string;
  branch?: string;
  isCI?: boolean;
  isPR?: boolean;
  targetBranch?: string;
  targetCommit?: string;
}

export async function getEnvironment(): Promise<Environment> {
  // TODO Add my own handlers for common services
  const { name, commit, isPr, branch, isCi, prBranch } = envCi({
    env: process.env,
    root: process.cwd(),
  });

  // TODO - I should add some warning if we're not on a CI/CD or an officially supported one

  return {
    name: name,
    commit:
      process.env.PIXELEYE_COMMIT ||
      commit ||
      (await getCommit().catch(() => undefined)),
    branch:
      process.env.PIXELEYE_BRANCH ||
      branch ||
      (await getBranch().catch(() => undefined)),
    isCI: isCi,
    isPR: isPr,
    targetBranch: process.env.PIXELEYE_TARGET_BRANCH || prBranch,
    targetCommit:
      process.env.PIXELEYE_TARGET_COMMIT ||
      (await getMergeBase(prBranch).catch(() => undefined)),
  };
}
