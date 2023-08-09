import { Method, Routes } from "api-typify";
import { User } from "../models/user";
import { Team } from "../models";

type GET = Method<{
  "/user/me": {
    res: User;
    req: undefined;
  };
  "/user/teams": {
    res: Team[];
    req: undefined;
  };
}>;

type DELETE = Method<{
  "/user/me": {
    res: undefined;
    req: undefined;
  };
}>;

export interface UserAPI {
  GET: GET;
  DELETE: DELETE;
}
