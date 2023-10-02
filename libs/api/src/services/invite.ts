import { Method } from "api-typify";
import { Project } from "../models/project";
import { Invite } from "../models";

type GET = Method<{
  "/invites/{id}": {
    res: Invite;
  };
}>;

type POST = Method<{
  "/invites/{id}/accept": {
    res: undefined;
  };
}>;

export interface InviteAPI {
  GET: GET;
  POST: POST;
}
