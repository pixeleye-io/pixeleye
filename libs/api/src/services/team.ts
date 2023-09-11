import { Method } from "api-typify";
import { Repo, UserOnTeam } from "../models";
import { Installation } from "../models/installation";

type GET = Method<{
  "/teams/{teamID}/repos": {
    res: Repo[];
  };
  "/teams/{teamID}/installations": {
    res: Installation[];
  };
  "/teams/{teamID}/users": {
    res: UserOnTeam[];
  };
}>;

export interface TeamAPI {
  GET: GET;
}
