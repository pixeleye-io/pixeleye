import { Method } from "api-typify";
import { Repo, TeamUsage, UserOnTeam } from "../models";
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
  "/teams/{teamID/usage": {
    res: TeamUsage;
    queries: {
      from: string;
      to: string;
    }
  };
}>;

type DELETE = Method<{
  "/teams/{teamID}/admin/users/{userID}": {
    res: undefined;
  };
}>;

export interface TeamAPI {
  GET: GET;
  DELETE: DELETE;
}
