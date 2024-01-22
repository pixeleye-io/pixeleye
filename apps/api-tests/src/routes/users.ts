import { env } from "../env";
import { IDs } from "../setup/credentialsSetup";
import { specAsUser } from "../specs";

const userEndpoint = env.SERVER_ENDPOINT + "/v1/user";

export const usersAPI = {
  getAuthenticatedUser: (user?: IDs, expectedStatus = 200) =>
    specAsUser(user)
      .get(userEndpoint + "/me")
      .expectStatus(expectedStatus),
  deleteUser: (user?: IDs, expectedStatus = 200) =>
    specAsUser(user)
      .get(userEndpoint + "/me")
      .expectStatus(expectedStatus),
  getUsersTeams: (user?: IDs, expectedStatus = 200) =>
    specAsUser(user)
      .get(userEndpoint + "/teams")
      .expectStatus(expectedStatus),
} as const;
