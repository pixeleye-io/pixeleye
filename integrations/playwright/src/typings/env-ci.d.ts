declare module "env-ci" {
  interface Options {
    env?: { [envVar: string]: any } | undefined;
    root?: string | undefined;
  }

  interface CiEnv {
    isCi: boolean;
    name?: string;
    service?: string;
    branch?: string;
    commit?: string;
    tag?: string;
    build?: string;
    buildUrl?: string;
    job?: string;
    jobUrl?: string;
    isPr?: boolean;
    pr?: string;
    prBranch?: string;
    slug?: string;
    root?: string;
  }

  export default function envCi(options?: Options): CiEnv;
}

