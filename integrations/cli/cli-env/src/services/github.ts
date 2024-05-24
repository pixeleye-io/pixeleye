/* eslint-disable turbo/no-undeclared-env-vars */
import { CiEnv } from "env-ci";
import { getCommit } from "../git";
import { existsSync, readFileSync } from "fs";

interface GithubPayload {
  pull_request?: {
    head: {
      sha: string;
      ref: string;
    };
    number: number;
  };
}

export async function getGithubEnv(env: CiEnv): Promise<CiEnv> {
  let payload: GithubPayload = {};
  if (
    process.env.GITHUB_EVENT_PATH &&
    existsSync(process.env.GITHUB_EVENT_PATH)
  ) {
    payload = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  }

  return {
    ...env,
    tag: payload.pull_request?.head.sha || env.tag,
    prBranch: process.env.GITHUB_HEAD_REF,
    commit: payload.pull_request?.head.sha || env.commit,
  };
}
