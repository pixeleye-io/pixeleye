import { Build, PartialSnapshot } from "@pixeleye/api";
import { env } from "../env";
import { specAsUser, specWithBuildToken } from "../specs";
import { IDs } from "../setup/credentialsSetup";

const buildClientEndpoint = env.SERVER_ENDPOINT + "/v1/client/builds";

const buildEndpoint = env.SERVER_ENDPOINT + "/v1/builds";

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
      .post(buildClientEndpoint + "/create")
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
      .post(buildClientEndpoint)
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
      .post(buildClientEndpoint + "/" + buildID + "/upload")
      .withBody({ snapshots: snaps })
      .expectStatus(expectedStatus),
  completeBuild: (buildID: string, token: string, expectedStatus = 202) =>
    specWithBuildToken(token)
      .post(buildClientEndpoint + "/" + buildID + "/complete")
      .expectStatus(expectedStatus),
  getBuild: (buildID: string, token: string, expectedStatus = 200) =>
    specWithBuildToken(token)
      .get(buildClientEndpoint + "/" + buildID)
      .expectStatus(expectedStatus),
  approveRemainingSnapshots: (
    buildID: string,
    user?: IDs,
    expectedStatus = 200
  ) =>
    specAsUser(user)
      .post(buildEndpoint + "/" + buildID + "/review/approve/remaining")
      .expectStatus(expectedStatus),
  rejectRenamingSnapshots: (
    buildID: string,
    user?: IDs,
    expectedStatus = 200
  ) =>
    specAsUser(user)
      .post(buildEndpoint + "/" + buildID + "/review/reject/remaining")
      .expectStatus(expectedStatus),

  approveSnapshots: (
    snapshotIDs: string[],
    buildID: string,
    user?: IDs,
    expectedStatus = 200
  ) =>
    specAsUser(user)
      .post(buildEndpoint + "/" + buildID + "/review/approve")
      .withBody({ snapshotIDs })
      .expectStatus(expectedStatus),
  rejectSnapshots: (
    snapshotIDs: string[],
    buildID: string,
    user?: IDs,
    expectedStatus = 200
  ) =>
    specAsUser(user)
      .post(buildEndpoint + "/" + buildID + "/review/reject")
      .withBody({ snapshotIDs })
      .expectStatus(expectedStatus),

  approveAllSnapshots: (buildID: string, user?: IDs, expectedStatus = 200) =>
    specAsUser(user)
      .post(buildEndpoint + "/" + buildID + "/review/approve/all")
      .expectStatus(expectedStatus),
  rejectAllSnapshots: (buildID: string, user?: IDs, expectedStatus = 200) =>
    specAsUser(user)
      .post(buildEndpoint + "/" + buildID + "/review/reject/all")
      .expectStatus(expectedStatus),
} as const;
