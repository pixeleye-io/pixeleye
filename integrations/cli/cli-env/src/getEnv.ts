/* eslint-disable turbo/no-undeclared-env-vars */
import envCi from "env-ci";
import { getBranch, getCommit } from "./git";
import { logger } from "@pixeleye/cli-logger";

export interface Environment {
  name?: string;
  commit?: string;
  branch?: string;
  isCI?: boolean;
  isPR?: boolean;
  targetBranch?: string;
  prID?: string;
  title?: string;
}

export async function getEnvironment(): Promise<Environment> {
  // TODO Add my own handlers for common services
  const env = envCi({
    env: process.env,
    root: process.cwd(),
  });

  logger.debug(`Detected CI: ${JSON.stringify(env)}`);
  const { name, isCi, pr, branch, commit, tag, prBranch, isPr } = env;

  // TODO - I should add some warning if we're not on a CI/CD or an officially supported one

  const gitBranch = await getBranch().catch(() => undefined);
  const gitCommit = await getCommit().catch(() => undefined);

  return {
    name: name,
    commit: (process.env.PIXELEYE_COMMIT || commit || gitCommit)?.trim(),
    branch: process.env.PIXELEYE_BRANCH || branch || gitBranch,
    targetBranch: process.env.PIXELEYE_PR_BRANCH || prBranch,
    isCI: isCi,
    isPR: isPr,
    prID: pr,
    title: tag,
  };
}
