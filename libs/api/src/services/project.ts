import { Method, Routes } from "api-typify";
import { Project } from "../models/project";

type GET = Method<{
  "/projects/{id}": {
    res: Project;
    req: undefined;
  };
  "/teams/{teamID}/projects": {
    res: Project[];
  };
}>;

type POST = Method<{
  "/teams/{teamID}/projects": {
    res: Project;
    req: Omit<Project, "id" | "createdAt" | "updatedAt" | "token" | "teamID">;
  };
  "/projects/{id}/new-token": {
    res: Project;
    req: undefined;
  };
}>;

export interface ProjectAPI {
  GET: GET;
  POST: POST;
}
