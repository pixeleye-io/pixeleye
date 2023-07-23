import { getAPI } from "api-typify";
import { Services } from "./services";

export const API = getAPI<
  Services,
  {
    headers?: HeadersInit;
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
  })
);

export default API;
