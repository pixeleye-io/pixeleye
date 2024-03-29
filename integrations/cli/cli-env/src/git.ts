import { $ } from "execa";

/**
 * Returns the current branch.
 */
export const getBranch = async () => {
  return (await $`git branch --show-current`).stdout || "HEAD";
};

export const getParentShas = async (n: number) => {
  return (await $`git log --pretty=format:%H -n ${n}`).stdout.split("\n");
};

export const getCommit = async () => {
  return (await $`git rev-parse HEAD`).stdout;
};

// Get merge base of current branch and target branch
export const getMergeBase = async (prBranch: string) => {
  return (await $`git merge-base HEAD ${prBranch}`).stdout;
};

export const isAncestor = async (sha1: string, sha2: string) => {
  return (
    await $`git merge-base --is-ancestor ${sha1} ${sha2}`.catch((err) => ({
      exitCode: 1,
    }))
  )?.exitCode === 0
    ? (await $`git rev-list --no-walk ${sha1} ${sha2}`).stdout.startsWith(sha1)
    : false;
};
