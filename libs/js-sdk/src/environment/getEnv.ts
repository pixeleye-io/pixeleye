import envCi from "env-ci";
import { getBranch, getCommit } from "./git";
import { Context } from "./context";

export interface Environment {
  name?: string;
  commit?: string;
  branch?: string;
  isCI?: boolean;
  isPR?: boolean;
}

export interface Service {
  isService: (ctx: Context) => boolean;
  getEnvironment: (ctx: Context) => Environment;
}

export async function getEnvironment(ctx: Context): Promise<Environment> {
  // TODO Add my own handlers for common services
  const { name, commit, isPr, branch, isCi } = envCi(ctx);

  // TODO - I should add some warning if we're not on a CI/CD or an officially supported one

  const gitBranch = await getBranch().catch(() => undefined);
  const gitCommit = await getCommit().catch(() => undefined);

  return {
    name: name,
    commit: ctx.env["PIXELEYE_COMMIT"] || commit || gitBranch,
    branch: ctx.env["PIXELEYE_BRANCH"] || branch || gitCommit,
    isCI: isCi,
    isPR: isPr,
  };
}
