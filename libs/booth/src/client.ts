import { fetch } from "undici";
import { SnapshotRequest } from "./handlers";

export interface Options {
  endpoint: string;
}

export function ping(opts: Options) {
  return fetch(`${opts.endpoint}/ping`);
}

export function snapshot(opts: Options, data: SnapshotRequest) {
  return fetch(`${opts.endpoint}/snapshot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export function finished(opts: Options) {
  return fetch(`${opts.endpoint}/finished`);
}
