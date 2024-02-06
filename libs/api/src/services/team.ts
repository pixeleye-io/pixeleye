import { Method } from "api-typify";
import { Repo, Subscription, Team, TeamPlan, UserOnTeam } from "../models";
import { Installation } from "../models/installation";

type GET = Method<{
  "/v1/teams/{teamID}/repos": {
    res: Repo[];
  };
  "/v1/teams/{teamID}/installations": {
    res: Installation[];
  };
  "/v1/teams/{teamID}/users": {
    res: UserOnTeam[];
  };
  "/v1/teams/{teamID}/usage/snapshots": {
    res: {
      snapshotCount: number;
      prevSnapshotCount: number;
    };
    queries: {
      from?: string;
      to?: string;
    };
  };
  "/v1/teams/{teamID}/usage/builds": {
    res: {
      buildCount: number;
      prevBuildCount: number;
    };
    queries: {
      from?: string;
      to?: string;
    };
  };
  "/v1/teams/{teamID}/billing/portal": {
    res: {
      billingPortalURL: string;
    };
  };
  "/v1/teams/{teamID}/billing/subscription": {
    res?: Subscription;
  };
}>;

type DELETE = Method<{
  "/v1/teams/{teamID}/admin/users/{userID}": {
    res: undefined;
  };
}>;

type POST = Method<{
  "/v1/teams/{teamID}/billing/account": {
    res: {
      billingPortalURL: string;
    };
  };
  "/v1/teams/{teamID}/billing/account2": {
    res: {
      clientSecret: string;
    };
  };
  "/v1/teams/{teamID}/billing/plan": {
    res: {
      billingPortalURL: string;
    };
  };
  "/v1/teams/{teamID}/billing/subscribe": {
    res: {
      checkoutURL: string;
    };
  };
}>;

type PATCH = Method<{
  "/v1/teams/{teamID}/admin": {
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
