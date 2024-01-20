import { Method } from "api-typify";
import { Build } from "../models/build";
import { PartialSnapshot, Snapshot } from "../models";

type GET = Method<{
  "/v1/builds/{id}": {
    res: Build;
  };
  "/v1/builds/{id}/snapshots": {
    res: (Snapshot & {
      snapHash?: string;
      baselineHash?: string;
      diffHash?: string;
    })[];
  };
}>;

type POST = Method<{
  "/v1/builds/{id}/review/abort": {
    req: undefined;
  };
  "/v1/client/builds/create": {
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
  "/v1/client/builds/{id}/upload": {
    res: undefined;
    req: {
      snapshots: PartialSnapshot[];
    };
  };
  "/v1/client/builds/{id}/complete": {
    res: undefined;
  };
  "/v1/client/builds": {
    res: Build[];
    req?: {
      shas?: string[];
    };
    queries?: {
      branch?: string;
      limit?: number;
    };
  };
  "/v1/client/builds/parents": {
    res: Build[];
    req?: {
      shas?: string[];
      branch?: string;
    };
  };
  "/v1/client/builds/{id}/abort": {
    res: undefined;
  };
  "/v1/builds/{id}/review/approve": {
    res: Build;
    req: {
      snapshotIDs: string[];
    };
  };
  "/v1/builds/{id}/review/reject": {
    res: Build;
    req: {
      snapshotIDs: string[];
    };
  };
  "/v1/builds/{id}/review/approve/all": {
    res: Build;
  };
  "/v1/builds/{id}/review/reject/all": {
    res: Build;
  };
  "/v1/builds/{id}/review/approve/remaining": {
    res: Build;
  };
  "/v1/builds/{id}/review/reject/remaining": {
    res: Build;
  };
}>;

export interface BuildAPI {
  GET: GET;
  POST: POST;
}
