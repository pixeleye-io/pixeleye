import envCi, { CiEnv } from "env-ci";
import { getGithubEnv } from "./github";

export function getEnv(): CiEnv {
  // TODO - I should add some warning if we're not on a CI/CD or an officially supported one
  const env = envCi();

  switch (env.service) {
    case "github":
      return getGithubEnv(env);
    default:
      return env;
  }
}
