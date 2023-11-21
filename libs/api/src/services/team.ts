import { Method } from "api-typify";
import { Repo, Team, UserOnTeam } from "../models";
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

type PATCH = Method<{
  "/teams/{teamID}/admin": {
    res: undefined;
    req: Pick<Team, "name" | "avatarURL" | "url">;
  };
}>;

export interface TeamAPI {
  GET: GET;
  DELETE: DELETE;
  PATCH: PATCH;
}
