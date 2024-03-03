/* eslint-disable turbo/no-undeclared-env-vars */
import { Configuration, FrontendApi } from "@ory/client";

// This is a bit of a hack for docker-compose, since we want our server-side code to access ory via the docker network
const oryEndpointClient = process.env.CLIENT_ORY_URL || process.env.ORY_URL!;

export const oryEndpoint = process.env.ORY_URL!;

export type { Session } from "@ory/client";

export const frontend = new FrontendApi(
  new Configuration({
    basePath: process.env.ORY_URL!,
    baseOptions: {
      withCredentials: true,
    },
  })
);

export const getUrlForFlow = (flow: string, query?: URLSearchParams) =>
  `${oryEndpointClient}/self-service/${flow}/browser${
    query ? `?${query.toString()}` : ""
  }`;

export const isQuerySet = (x: any): x is string =>
  typeof x === "string" && x.length > 0;
