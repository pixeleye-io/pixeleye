import Spec from "pactum/src/models/Spec";
import { usersAPI } from "../../routes/users";
import { IDs } from "../../setup/credentialsSetup";
import { describe, it } from "vitest";
import { getSession } from "../../setup/getSession";
import { like } from "pactum-matchers";

describe("User Accounts", () => {
  it("should return authenticated user jekyll", async () => {
    const session = getSession(IDs.jekyll);
    await usersAPI.getAuthenticatedUser().expectJsonMatch({
      authID: session.session.identity.id,
      email: session.session.identity.traits.email,
      id: like("12"),
    });
  });
  it("should return authenticated user hyde", async () => {
    const session = getSession(IDs.hyde);
    await usersAPI.getAuthenticatedUser(IDs.hyde).expectJsonMatch({
      authID: session.session.identity.id,
      email: session.session.identity.traits.email,
      id: like("12"),
    });
  });
  it("it should not allow me to get authenticated user with invalid credentials", async () => {
    await ((await usersAPI.getAuthenticatedUser(IDs.public, 401)) as Spec);
  });
});
