import { Method, Routes } from "api-typify";
import { Build } from "../models/build";

type GET = Method<{
  "/builds/{id}": {
    res: Build;
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

type POST = Method<{
  "/builds/create": {
    res: undefined;
    req: Omit<Build, "createdAt" | "updatedAt" | "id" | "status" | "errors" | "projectID" | "buildNumber">;
  };
  "/builds/{id}/upload": {
    res: undefined;
    req: undefined;
  };
  "/builds/{id}/complete": {
    res: undefined;
    req: undefined;
  };
}>;

export interface BuildAPI extends Routes {
  GET: GET;
  POST: POST;
}
