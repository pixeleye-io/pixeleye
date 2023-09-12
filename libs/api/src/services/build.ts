import { Method } from "api-typify";
import { Build } from "../models/build";
import { PartialSnapshot, Snapshot } from "../models";

type GET = Method<{
  "/builds/{id}": {
    res: Build;
  };
  "/client/builds": {
    res: Build[];
    queries?: {
      branch?: string;
    };
  };
  "/builds/{id}/snapshots": {
    res: (Snapshot & {
      snapHash?: string;
      baselineHash?: string;
      diffHash?: string;
    })[];
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
  "/builds/{id}/review/approve": {
    res: Build;
    req: {
      snapshotIDs: string[];
    };
  };
  "/builds/{id}/review/reject": {
    res: Build;
    req: {
      snapshotIDs: string[];
    };
  };
  "/builds/{id}/review/approve/all": {
    res: Build;
  };
  "/builds/{id}/review/reject/all": {
    res: Build;
  };
}>;

export interface BuildAPI {
  GET: GET;
  POST: POST;
}
