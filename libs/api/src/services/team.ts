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
  "/teams/{teamID}/usage/snapshots": {
    res: {
      snapshotCount: number;
      prevSnapshotCount: number;
    };
    queries: {
      from?: string;
      to?: string;
    };
  };
  "/teams/{teamID}/usage/builds": {
    res: {
      buildCount: number;
      prevBuildCount: number;
    };
    queries: {
      from?: string;
      to?: string;
    };
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
