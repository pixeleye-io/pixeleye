import { env } from "@/env";
import { Configuration, FrontendApi } from "@ory/client";

export const oryEndpoint = env.ORY_URL;

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
