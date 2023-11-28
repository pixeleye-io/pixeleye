import { fetch } from "undici";
import { SnapshotOptions } from "./types";

export interface Options {
  endpoint: string;
}

export function ping(opts: Options) {
  return fetch(`${opts.endpoint}/ping`);
}

export function script(opts: Options) {
  return fetch(`${opts.endpoint}/script`).then((res) => res.text());
}

export function snapshot(opts: Options, data: SnapshotOptions) {
  return fetch(`${opts.endpoint}/snapshot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
