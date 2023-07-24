import { Method, Routes } from "api-typify";
import { User } from "../models/user";

type GET = Method<{
  "/user/me": {
    res: User;
    req: undefined;
  };
}>;

export interface UserAPI extends Routes {
  GET: GET;
}
