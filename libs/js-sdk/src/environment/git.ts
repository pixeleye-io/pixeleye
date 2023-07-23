import { $ } from "execa";

/**
 * Returns the current branch.
 */
export const getBranch = async () => {
  return (await $`git branch --show-current`).stdout || "HEAD";
};

export const getParentShas = async (n: number) => {
  return (await $`git rev-list HEAD~${n}..HEAD`).stdout.split("\n");
};
