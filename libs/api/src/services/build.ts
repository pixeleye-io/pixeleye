import { Method, Routes } from "api-typify";
import { Build } from "../models/build";

type GET = Method<{
  "/builds/{id}": {
    res: Build;
    req: undefined;
  };
  "/builds": {
    res: Build[];
    req: undefined;
    queries?: {
      project_id: string;
      branch: string;
    };
  };
}>;

type POST = Method<{
  "/builds/create": {
    res: undefined;
    req: Build;
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
