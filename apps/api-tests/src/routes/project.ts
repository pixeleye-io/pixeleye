import { env } from "../env";
import { IDs } from "../setup/credentialsSetup";
import { specAsUser } from "../specs";

const projectEndpoint = env.SERVER_ENDPOINT + "/v1/projects";

export const projectAPI = {
  getTeamsProjects: (user?: IDs, expectedStatus = 200) =>
    specAsUser(user)
      .post(projectEndpoint)
      .expectStatus(expectedStatus),
  deleteUser: (user?: IDs, expectedStatus = 200) =>
    specAsUser(user)
      .get(projectEndpoint + "/me")
      .expectStatus(expectedStatus),
  getUsersTeams: (user?: IDs, expectedStatus = 200) =>
    specAsUser(user)
      .get(projectEndpoint + "/teams")
      .expectStatus(expectedStatus),
} as const;
