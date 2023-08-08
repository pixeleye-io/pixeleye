import { Build, PartialSnapshot } from "@pixeleye/api";
import { env } from "../env";
import { specWithBuildToken } from "../specs";

const snapshotEndpoint = env.SERVER_ENDPOINT + "/v1/client/builds";

export const buildTokenAPI = {
  createBuild: (
    token: string,
    build: Omit<
      Build,
      | "createdAt"
      | "updatedAt"
      | "id"
      | "status"
      | "errors"
      | "projectID"
      | "buildNumber"
    >,
    expectedStatus = 201
  ) =>
    specWithBuildToken(token)
      .withBody(build)
      .post(snapshotEndpoint + "/create")
      .expectStatus(expectedStatus),
  searchBuilds: (
    token: string,
    options?: {
      shas?: string[];
      branch?: string;
    },
    expectedStatus = 200
  ) =>
    specWithBuildToken(token)
      .post(snapshotEndpoint)
      .withBody({ shas: options?.shas })
      .withQueryParams({ branch: options?.branch })
      .expectStatus(expectedStatus),
  linkSnapshotsToBuild: (
    snaps: PartialSnapshot[],
    buildID: string,
    token: string,
    expectedStatus = 200
  ) =>
    specWithBuildToken(token)
      .post(snapshotEndpoint + "/" + buildID + "/upload")
      .withBody({ snapshots: snaps })
      .expectStatus(expectedStatus),
  completeBuild: (buildID: string, token: string, expectedStatus = 202) =>
    specWithBuildToken(token)
      .post(snapshotEndpoint + "/" + buildID + "/complete")
      .expectStatus(expectedStatus),
  getBuild: (buildID: string, token: string, expectedStatus = 200) =>
    specWithBuildToken(token)
      .get(snapshotEndpoint + "/" + buildID)
      .expectStatus(expectedStatus),
} as const;
