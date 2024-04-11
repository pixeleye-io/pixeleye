/* eslint-disable turbo/no-undeclared-env-vars */
import { CiEnv } from "env-ci";
import { getCommit } from "../git";

export async function getGithubEnv(env: CiEnv): Promise<CiEnv> {
  const commitSha = await getCommit();
  return {
    ...env,
    prBranch: process.env.GITHUB_HEAD_REF,
    commit: commitSha || env.commit,
  };
}
