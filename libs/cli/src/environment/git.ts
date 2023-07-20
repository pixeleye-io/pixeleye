import { $ } from "execa";

/**
 * Returns the current branch.
 */
export const getBranch = async () => {
  return (await $`git branch --show-current`).stdout || "HEAD";
};
