import { IDs, getAuthSession } from "./setup/credentialsSetup";
import pactum from "pactum";

export async function specAsUser(
  user: IDs = IDs.jekyll,
  requestTimeOut = 10000
) {
  const session = await getAuthSession(user);

  return pactum
    .spec()
    .withHeaders({
      "X-Session-Token": session.session_token,
    })
    .withRequestTimeout(requestTimeOut);
}
