import { Method } from "api-typify";
import { Project } from "../models/project";
import { Build, UserOnProject } from "../models";

type GET = Method<{
  "/projects/{id}": {
    res: Project;
  };
  "/projects/{id}/users": {
    res: UserOnProject[];
  };
  "/teams/{teamID}/projects": {
    res: Project[];
  };
  "/projects/{id}/builds": {
    res: Build[];
    queries?: {
      branch?: string;
    };
  };
}>;

type POST = Method<{
  "/teams/{teamID}/projects": {
    res: Project;
    req: Omit<Project, "id" | "createdAt" | "updatedAt" | "token" | "teamID">;
  };
  "/projects/{id}/admin/new-token": {
    res: Project;
    req: undefined;
  };
}>;

type DELETE = Method<{
  "/projects/{id}/admin": {
    res: undefined;
    req: {
      name: string;
    };
  };
}>;

export interface ProjectAPI {
  GET: GET;
  POST: POST;
  DELETE: DELETE;
}
