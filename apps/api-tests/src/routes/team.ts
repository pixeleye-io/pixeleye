import { Project } from "@pixeleye/api";
import { env } from "../env";
import { IDs } from "../setup/credentialsSetup";
import { specAsUser } from "../specs";

const teamEndpoint = env.SERVER_ENDPOINT + "/v1/teams/";

export type ProjectBody = Pick<Project, "name" | "url" | "source">;

export const teamAPI = {
  getTeamsProjects: (teamID: string, user?: IDs, expectedStatus = 200) =>
    specAsUser(user)
      .get(teamEndpoint + teamID + "/projects")
      .expectStatus(expectedStatus),
  createTeamProject: (
    project: ProjectBody,
    teamID: string,
    user?: IDs,
    expectedStatus = 201
  ) =>
    specAsUser(user)
      .withBody(project)
      .post(teamEndpoint + teamID + "/projects")
      .expectStatus(expectedStatus),
} as const;
