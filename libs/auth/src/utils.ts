import { Configuration, FrontendApi } from "@ory/client";

// eslint-disable-next-line turbo/no-undeclared-env-vars
export const oryEndpoint = process.env.ORY_URL;

export type { Session } from "@ory/client";

export const frontend = new FrontendApi(
  new Configuration({
    basePath: oryEndpoint,
    baseOptions: {
      withCredentials: true,
    },
  })
);

export const getUrlForFlow = (flow: string, query?: URLSearchParams) =>
  `${oryEndpoint}/self-service/${flow}/browser${
    query ? `?${query.toString()}` : ""
  }`;

export const isQuerySet = (x: any): x is string =>
  typeof x === "string" && x.length > 0;
