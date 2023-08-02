import { usersAPI } from "../../routes/users";
import { describe, it } from "vitest";
import { eachLike, like } from "pactum-matchers";
import { handler } from "pactum";

// We might have a bunch of teams returned due to other tests running in parallel
// All we care about is the Personal team for this test
handler.addExpectHandler("userTeam", (ctx: any) => {
  const personalTeams = ctx.res.json.filter(
    (team: any) => team.type === "user" && team.role === "owner"
  );

  expect(personalTeams).to.have.length(1);
  expect(personalTeams[0]).to.have.property("name", "Personal");
  expect(personalTeams[0]).to.have.property("type", "user");
  expect(personalTeams[0]).to.have.property("role", "owner");
});

describe("User teams", () => {
  it("should return users teams", async () => {
    await usersAPI
      .getUsersTeams()
      .expectJsonMatch(
        eachLike({
          id: like("12"),
          createdAt: like("2021-08-24T15:20:00.000Z"),
          updatedAt: like("2021-08-24T15:20:00.000Z"),
          name: like("Personal"),
          type: like("user"),
          avatarURL: like("https://assets.pixeleye.dev"),
          url: like("https://assets.pixeleye.dev"),
          role: like("owner"),
        })
      )
      .expect("userTeam");
  });
});
