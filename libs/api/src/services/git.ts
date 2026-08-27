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
  "/v1/git/bitbucket-server": {
    res: {
      installation: Installation;
      team: Team;
    };
    req: {
      teamName: string;
      baseURL: string;
      accessToken: string;
    };
  };
}>;

export interface GitAPI {
  POST: POST;
}
