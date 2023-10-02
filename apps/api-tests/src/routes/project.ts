import { env } from "../env";
import { IDs } from "../setup/credentialsSetup";
import { specAsUser } from "../specs";

const projectEndpoint = env.SERVER_ENDPOINT + "/v1/projects";

export const projectAPI = {
  acceptInvite: (inviteID: string, user?: IDs, expectedStatus = 201) =>
    specAsUser(user)
      .withBody({ id: inviteID })
      .post(projectEndpoint)
      .expectStatus(expectedStatus),
  getProject: (projectID: string, user?: IDs, expectedStatus = 200) =>
    specAsUser(user)
      .get(projectEndpoint + `/${projectID}`)
      .expectStatus(expectedStatus),
  deleteProject: (
    projectID: string,
    projectName: string,
    user?: IDs,
    expectedStatus = 204
  ) =>
    specAsUser(user)
      .withBody({ name: projectName })
      .delete(projectEndpoint + `/${projectID}/admin`)
      .expectStatus(expectedStatus),
  regenerateToken: (projectID: string, user?: IDs, expectedStatus = 200) =>
    specAsUser(user)
      .post(projectEndpoint + `/${projectID}/admin/new-token`)
      .expectStatus(expectedStatus),
  addUserToProject: (
    projectID: string,
    email: string,
    role: string,
    user?: IDs,
    expectedStatus = 201
  ) =>
    specAsUser(user)
      .withBody({ email, role, disableEmail: true })
      .post(projectEndpoint + `/${projectID}/admin/users`)
      .expectStatus(expectedStatus),
  removeUserFromProject: (
    projectID: string,
    userID: string,
    user?: IDs,
    expectedStatus = 204
  ) =>
    specAsUser(user)
      .delete(projectEndpoint + `/${projectID}/admin/users/${userID}`)
      .expectStatus(expectedStatus),
  updateUserRole: (
    projectID: string,
    userID: string,
    role: string,
    user?: IDs,
    expectedStatus = 204
  ) =>
    specAsUser(user)
      .withBody({ role })
      .patch(projectEndpoint + `/${projectID}/admin/users/${userID}`)
      .expectStatus(expectedStatus),
} as const;
