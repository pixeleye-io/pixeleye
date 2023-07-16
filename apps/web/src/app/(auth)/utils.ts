import { Configuration, FrontendApi } from "@ory/client";

export const apiBaseUrlInternal =
  process.env.KRATOS_PUBLIC_URL ||
  process.env.ORY_SDK_URL ||
  "http://localhost:4000/.ory";

export const apiBaseUrl = process.env.KRATOS_BROWSER_URL || apiBaseUrlInternal;

export const frontend = new FrontendApi(
  new Configuration({ basePath: apiBaseUrl })
);

export const getUrlForFlow = (flow: string, query?: URLSearchParams) =>
  `${apiBaseUrl}/self-service/${flow}/browser${
    query ? `?${query.toString()}` : ""
  }`;

export const isQuerySet = (x: any): x is string =>
  typeof x === "string" && x.length > 0;
