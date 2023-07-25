import { Method, Routes } from "api-typify";
import { Project } from "../models/project";

type GET = Method<{
  "/projects/{id}": {
    res: Project;
    req: undefined;
  };
  "/projects": {
    res: Project[];
  };
}>;

type POST = Method<{
  "/projects": {
    res: Project;
    req: Omit<Project, "id" | "createdAt" | "updatedAt" | "token">;
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
