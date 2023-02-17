import { api as createAPI } from "./api";
import { service } from "./service";

export interface Options {
  url?: string;
  credentials: {
    key: string;
    secret: string;
  };
}

export function createClient({
  url = "https://pixeleye.io",
  credentials,
}: Options) {
  const creds = Buffer.from(
    `${credentials.key}:${credentials.secret}`,
  ).toString("base64");
  const api = createAPI(url, creds);
  return Object.assign(
    {
      api,
    },
    service(api),
  );
}
