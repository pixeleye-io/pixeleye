import { Method } from "api-typify";
import { Project } from "../models/project";
import { Build, UserOnProject, UserOnProjectRole } from "../models";

type GET = Method<{
  "/v1/projects/{id}": {
    res: Project;
  };
  "/v1/projects/{id}/users": {
    res: UserOnProject[];
  };
  "/v1/teams/{teamID}/projects": {
    res: Project[];
  };
  "/v1/projects/{id}/builds": {
    res: Build[];
    queries?: {
      branch?: string;
      limit?: number;
      offset?: number;
    };
  };
}>;

type POST = Method<{
  "/v1/teams/{teamID}/projects": {
    res: Project;
    req: Omit<Project, "id" | "createdAt" | "updatedAt" | "token" | "teamID">;
  };
  "/v1/projects/{id}/admin/new-token": {
    res: Project;
    req: undefined;
  };
  "/v1/projects/{id}/admin/users": {
    res: UserOnProject;
    req: {
      email: string;
      role: UserOnProjectRole;
      disableEmail?: boolean;
    };
  };
}>;

type DELETE = Method<{
  "/v1/projects/{id}/admin": {
    res: undefined;
    req: {
      name: string;
    };
  };
  "/v1/projects/{id}/admin/users/{userID}": {
    res: undefined;
    req: undefined;
  };
}>;

type PATCH = Method<{
  "/v1/projects/{id}/admin/users/{userID}": {
    res: undefined;
    req: {
      role?: UserOnProjectRole;
      sync?: boolean;
    };
  };
  "/v1/projects/{id}/admin": {
    res: undefined;
    req: {
      name?: string;
      snapshotThreshold?: number;
    };
  };
}>;

export interface ProjectAPI {
  GET: GET;
  POST: POST;
  DELETE: DELETE;
  PATCH: PATCH;
}
