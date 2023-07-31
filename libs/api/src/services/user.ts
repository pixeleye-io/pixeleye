import { Method, Routes } from "api-typify";
import { User } from "../models/user";

type GET = Method<{
  "/user/me": {
    res: User;
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
