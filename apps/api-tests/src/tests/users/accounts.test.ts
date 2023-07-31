import Spec from "pactum/src/models/Spec";
import { usersAPI } from "../../routes/users";
import { IDs } from "../../setup/credentialsSetup";
import { describe, it } from "vitest";
import { getSession } from "../../setup/getSession";

describe("User Accounts", () => {
  it("should return authenticated user", async () => {
    const session = getSession(IDs.jekyll);
    await usersAPI.getAuthenticatedUser().expectJsonLike({
      id: session.session.identity.id,
      name: session.session.identity.traits.name,
      avatar: session.session.identity.traits.avatar,
      email: session.session.identity.traits.email,
    });
  });
  it("it should not allow me to get authenticated user with invalid credentials", async () => {
    await ((await usersAPI.getAuthenticatedUser(IDs.public, 401)) as Spec);
  });
});
