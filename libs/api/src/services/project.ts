import { Method } from "api-typify";
import { Project } from "../models/project";
import { Build, UserOnProject, UserOnProjectRole } from "../models";

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
  "/projects/{id}/admin/users": {
    res: UserOnProject;
    req: {
      email: string;
      role: UserOnProjectRole;
      disableEmail?: boolean;
    };
  };
}>;

type DELETE = Method<{
  "/projects/{id}/admin": {
    res: undefined;
    req: {
      name: string;
    };
  };
  "/projects/{id}/admin/users/{userID}": {
    res: undefined;
    req: undefined;
  };
}>;

type PATCH = Method<{
  "/projects/{id}/admin/users/{userID}": {
    res: undefined;
    req: {
      role?: UserOnProjectRole;
      sync?: boolean;
    };
  };
}>;

export interface ProjectAPI {
  GET: GET;
  POST: POST;
  DELETE: DELETE;
  PATCH: PATCH;
}
