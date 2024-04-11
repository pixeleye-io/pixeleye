/* eslint-disable turbo/no-undeclared-env-vars */
import { getBranch, getCommit } from "./git";
import { logger } from "@pixeleye/cli-logger";
import { getEnv } from "./services";

export interface Environment {
  name?: string;
  commit?: string;
  branch?: string;
  isCI?: boolean;
  isPR?: boolean;
  targetBranch?: string;
  prID?: string;
  title?: string;
  shardID?: string;
}

export async function getEnvironment(): Promise<Environment> {
  const env = getEnv();

  logger.debug(`Detected CI: ${JSON.stringify(env)}`);
  const { name, isCi, pr, branch: ciBranch, commit, tag, prBranch, isPr } = env;

  const gitBranch = await getBranch().catch(() => undefined);
  const gitCommit = await getCommit().catch(() => undefined);

  const branch = process.env.PIXELEYE_BRANCH || ciBranch || gitBranch;

  return {
    name: name,
    commit: (process.env.PIXELEYE_COMMIT || commit || gitCommit)?.trim(),
    branch: process.env.PIXELEYE_BASE_BRANCH || isPr ? prBranch : branch,
    targetBranch: isPr ? process.env.PIXELEYE_PR_BRANCH || branch : undefined,
    isCI: isCi,
    isPR: isPr,
    prID: pr,
    title: tag,
    shardID: process.env.PIXELEYE_SHARD_ID || env.build,
  };
}
