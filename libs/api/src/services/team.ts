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

type DELETE = Method<{
  "/teams/{teamID}/admin/users/{userID}": {
    res: undefined;
  };
}>;

export interface TeamAPI {
  GET: GET;
  DELETE: DELETE;
}
