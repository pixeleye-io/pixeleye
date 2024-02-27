import { Method, Routes } from "api-typify";
import { User } from "../models/user";
import { Team } from "../models";

type GET = Method<{
  "/v1/user/me": {
    res: User;
    req: undefined;
  };
  "/v1/user/teams": {
    res: Team[];
    req: undefined;
  };
}>;

type DELETE = Method<{
  "/v1/user/me": {
    res: undefined;
    req: undefined;
  };
}>;

type POST = Method<{
  "/v1/user/teams/sync": {
    res: undefined;
    req: undefined;
  };
  "/v1/user/refer": {
    res: undefined;
    req: {
      userID: string;
    };
  };
}>;

type PATCH = Method<{
  "/v1/user/me": {
    res: undefined;
    req: Partial<Pick<User, "avatar" | "name">>;
  };
}>;

export interface UserAPI {
  GET: GET;
  DELETE: DELETE;
  POST: POST;
  PATCH: PATCH;
}
