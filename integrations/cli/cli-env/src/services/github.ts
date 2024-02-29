/* eslint-disable turbo/no-undeclared-env-vars */
import { CiEnv } from "env-ci";

export function getGithubEnv(env: CiEnv): CiEnv {
  return {
    ...env,
    prBranch: process.env.GITHUB_HEAD_REF,
  };
}
