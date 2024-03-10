import { fetchRetry } from "@pixeleye/cli-api";
import { Response } from "undici";
import { SnapshotRequest } from "./server";

export interface Options {
  endpoint: string;
}

export function ping(opts: Options): Promise<Response> {
  return fetchRetry(`${opts.endpoint}/ping`, undefined, 10);
}

export function snapshot(
  opts: Options,
  data: SnapshotRequest
): Promise<Response> {
  return fetchRetry(`${opts.endpoint}/snapshot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export function finished(opts: Options): Promise<Response> {
  return fetchRetry(`${opts.endpoint}/finished`);
}
