import { getAPI } from "api-typify";
import { Services } from "./services";
export * from "./models";

export const API = getAPI<
  Services,
  {
    headers?: HeadersInit;
    next?: {
      revalidate?: number | false;
      tags?: string[];
    };
  }
>("http://localhost:5000/v1", (url, options) =>
  fetch(url, {
    ...options,

    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  }).then((res) => {
    if(res.ok) {
      return res.json();
    }
    return Promise.reject(res);
  })
);

export default API;

