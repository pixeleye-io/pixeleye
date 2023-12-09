import { fetch, RequestInit, Response } from "undici";
import { SnapshotRequest } from "./handlers";

export interface Options {
  endpoint: string;
}

const fetchRetry = (
  url: string,
  options?: RequestInit,
  retries = 3,
  timeout = 1000
): Promise<Response> =>
  fetch(url, options).catch(async (err) => {
    if (retries === 0) {
      throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, timeout));
    return fetchRetry(url, options, retries - 1);
  });

export function ping(opts: Options) {
  return fetchRetry(`${opts.endpoint}/ping`, undefined, 10, 2000);
}

export function snapshot(opts: Options, data: SnapshotRequest) {
  return fetchRetry(`${opts.endpoint}/snapshot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export function finished(opts: Options) {
  return fetchRetry(`${opts.endpoint}/finished`);
}
