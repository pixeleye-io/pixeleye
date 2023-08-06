import { env } from "../env";
import { specWithBuildToken } from "../specs";

const userEndpoint = env.SERVER_ENDPOINT + "/v1/builds";

export const buildTokenAPI = {
  createBuild: (token: string, expectedStatus = 200) =>
    specWithBuildToken(token)
      .get(userEndpoint + "/create")
      .expectStatus(expectedStatus),
} as const;
