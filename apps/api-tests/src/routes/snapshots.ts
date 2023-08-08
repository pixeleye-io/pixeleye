import { env } from "../env";
import { specWithBuildToken } from "../specs";

const snapshotEndpoint = env.SERVER_ENDPOINT + "/v1/client/snapshots";

export const snapshotTokenAPI = {
  uploadSnapshot: (hash: string, token: string, expectedStatus = 200) =>
    specWithBuildToken(token)
      .post(snapshotEndpoint + "/upload/" + hash)
      .expectStatus(expectedStatus),
} as const;
