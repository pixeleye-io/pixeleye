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
<<<<<<< Updated upstream
=======
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
  "/teams/{teamID}/billing/portal": {
    res: {
      billingPortalURL: string;
    };
  };
>>>>>>> Stashed changes
}>;

type DELETE = Method<{
  "/teams/{teamID}/admin/users/{userID}": {
    res: undefined;
  };
}>;

type POST = Method<{
  "/teams/{teamID}/billing/account": {
    res: {
      billingPortalURL: string;
    };
  };
  "/teams/{teamID}/billing/plan": {
    res: {
      billingPortalURL: string;
    };
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
  POST: POST;
}
