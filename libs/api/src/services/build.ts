import { Method, Routes } from "api-typify";
import { Build } from "../models/build";
import { PartialSnapshot, Snapshot } from "../models";

type GET = Method<{
  "/builds/{id}": {
    res: Build;
    req: undefined;
  };
  "/builds": {
    res: Build[];
    queries?: {
      branch?: string;
    };
  };
}>;

type POST = Method<{
  "/builds/create": {
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
  "/builds/{id}/upload": {
    res: undefined;
    req: {
      snapshots: PartialSnapshot[];
    };
  };
  "/builds/{id}/complete": {
    res: undefined;
    req: undefined;
  };
  "/builds": {
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
