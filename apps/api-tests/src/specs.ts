import { IDs } from "./setup/credentialsSetup";
import pactum from "pactum";
import { getSession } from "./setup/getSession";

export function specAsUser(user: IDs = IDs.jekyll, requestTimeOut = 10000) {
  const session = getSession(user);

  return pactum
    .spec()
    .withHeaders({
      Authorization: `Bearer ${session.session_token}`,
    })
    .withRequestTimeout(requestTimeOut);
}

export function specWithBuildToken(buildToken: string, requestTimeOut = 10000) {
  return pactum
    .spec()
    .withHeaders({
      Authorization: `Bearer ${buildToken}`,
    })
    .withRequestTimeout(requestTimeOut);
}
