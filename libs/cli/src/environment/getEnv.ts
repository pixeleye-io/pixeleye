import envCi from "env-ci";

export interface Context {
  env: NodeJS.ProcessEnv;
}

export interface Environment {
  name: string;
  commit: string;
  branch: string;
  isCI: boolean;
  isPR: boolean;
}

export interface Service {
  isService: (ctx: Context) => boolean;
  getEnvironment: (ctx: Context) => Environment;
}

export function getEnvironment(ctx: Context) {
  // TODO Add my own handlers for common services
  const { name, commit, isPr, branch, isCi } = envCi(ctx);

  // TODO - I should add some warning if we're not on a CI/CD or an officially supported one

  return {
    name,
    commit,
    branch,
    isCI: isCi,
    isPR: isPr,
  };
}
