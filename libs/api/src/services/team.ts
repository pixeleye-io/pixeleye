import { Method } from "api-typify";
import { Repo } from "../models";
import { Installation } from "../models/installation";

type GET = Method<{
  "/teams/{teamID}/repos": {
    res: Repo[];
  };
  "/teams/{teamID}/installations": {
    res: Installation[];
  };
}>;

export interface TeamAPI {
  GET: GET;
}
