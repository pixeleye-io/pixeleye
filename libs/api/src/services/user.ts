import { Method, Routes } from "api-typify";
import { User } from "../models/user";

type GET = Method<{
  "/user": {
    res: User;
    req: undefined;
  };
}>;

export interface UserAPI extends Routes {
  get: GET;
}
