import { Method } from "api-typify";
import { Installation } from "../models/installation";

type POST = Method<{
  "/git/github": {
    res: Installation;
    queries: {
      installation_id: string;
    };
  };
}>;

export interface GitAPI {
  POST: POST;
}
