import { Method } from "api-typify";
import { Installation } from "../models/installation";
import { Team } from "../models";

type POST = Method<{
  "/v1/git/github": {
    res: {
      installation: Installation;
      team: Team;
    };
    queries: {
      installation_id: string;
    };
  };
}>;

export interface GitAPI {
  POST: POST;
}
