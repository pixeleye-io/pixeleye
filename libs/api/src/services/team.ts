import { Method } from "api-typify";
import { Repo } from "../models";

type GET = Method<{
  "/teams/{teamID}/repos": {
    res: Repo[];
  };
}>;

export interface TeamAPI {
  GET: GET;
}
