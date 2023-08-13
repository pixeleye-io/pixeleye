import { Method } from "api-typify";
import { Build } from "../models/build";
import { PartialSnapshot } from "../models";

type GET = Method<{
  "/builds/{id}": {
    res: Build;
    req: undefined;
  };
  "/client/builds": {
    res: Build[];
    queries?: {
      branch?: string;
    };
  };
}>;

type POST = Method<{
  "/client/builds/create": {
    res: Build;
    req: Omit<
      Build,
      | "createdAt"
      | "updatedAt"
      | "id"
      | "status"
      | "errors"
      | "projectID"
      | "buildNumber"
    >;
  };
  "/client/builds/{id}/upload": {
    res: undefined;
    req: {
      snapshots: PartialSnapshot[];
    };
  };
  "/client/builds/{id}/complete": {
    res: undefined;
    req: undefined;
  };
  "/client/builds": {
    res: Build[];
    req?: {
      shas: string[];
    };
    queries?: {
      branch?: string;
    };
  };
}>;

export interface BuildAPI {
  GET: GET;
  POST: POST;
}
