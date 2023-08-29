import { Method, Routes } from "api-typify";

type GET = Method<{
  "/ping": {
    res: {
      message: "pong";
    };
    req: undefined;
  };
}>;

export interface PingAPI {
  GET: GET;
}
