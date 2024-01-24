/* eslint-disable turbo/no-undeclared-env-vars */
import envCi from "env-ci";
import { getBranch, getCommit } from "./git";

export interface Environment {
  name?: string;
  commit?: string;
  branch?: string;
  isCI?: boolean;
  isPR?: boolean;
  prBranch?: string;
}

export async function getEnvironment(): Promise<Environment> {
  // TODO Add my own handlers for common services
  const { name, commit, isPr, branch, isCi, prBranch } = envCi({
    env: process.env,
    root: process.cwd(),
  });

  // TODO - I should add some warning if we're not on a CI/CD or an officially supported one

  const gitBranch = await getBranch().catch(() => undefined);
  const gitCommit = await getCommit().catch(() => undefined);

  return {
    name: name,
    commit: process.env.PIXELEYE_COMMIT || commit || gitBranch,
    branch: process.env.PIXELEYE_BRANCH || branch || gitCommit,
    prBranch: process.env.PIXELEYE_PR_BRANCH || prBranch,
    isCI: isCi,
    isPR: isPr,
  };
}
