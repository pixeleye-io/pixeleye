/* eslint-disable turbo/no-undeclared-env-vars */
import { Configuration, FrontendApi } from "@ory/client";

// If we're on the client, we can use the NEXT_PUBLIC_ environment variables
// This is a bit of a hack for docker-compose, since we want our server-side code to access ory via the docker network
export const oryEndpoint =
  process.env.NEXT_PUBLIC_ORY_URL! || process.env.ORY_URL!;

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
  `${oryEndpoint}/self-service/${flow}/browser${
    query ? `?${query.toString()}` : ""
  }`;

export const isQuerySet = (x: any): x is string =>
  typeof x === "string" && x.length > 0;
