import { env } from "../env";
import { specWithBuildToken } from "../specs";

const snapshotEndpoint = env.BACKEND_URL + "/v1/client/snapshots";

export const snapshotTokenAPI = {
  uploadSnapshot: (
    hash: string,
    height: number,
    width: number,
    token: string,
    expectedStatus = 200
  ) =>
    specWithBuildToken(token)
      .withBody({
        snapshots: [
          {
            hash,
            height,
            width,
            format: "image/png",
          },
        ],
      })
      .post(snapshotEndpoint + "/upload")
      .expectStatus(expectedStatus),
} as const;
