import { ProjectBody, teamAPI } from "../../routes/team";
import { IDs } from "../../setup/credentialsSetup";
import { describe, it } from "vitest";
import { getSession } from "../../setup/getSession";
import { Project, Team } from "@pixeleye/api";
import { usersAPI } from "../../routes/users";
import { like } from "pactum-matchers";

describe("Team projects", () => {
  let teams: Team[];

  beforeAll(async () => {
    teams = await usersAPI.getUsersTeams(IDs.jekyll).returns(({ res }) => {
      return res.json;
    });
  });

  it("should create a team project", async (ctx) => {
    const session = getSession(IDs.jekyll);
    console.log(teams);
    const userTeam = teams.find(
      (team) => team.type === "user" && team.role === "owner"
    )!;

    const project: ProjectBody = {
      name: "test",
      url: "https://pixeleye.dev",
      source: "custom",
    };

    await teamAPI.createTeamProject(project, userTeam.id, IDs.jekyll).expectJsonMatch({
      id: like("1234"),
      createdAt: like("2021-01-01T00:00:00.000Z"),
      updatedAt: like("2021-01-01T00:00:00.000Z"),
      type: "user",
      name: "test",
    });
  });
});
// it("should return authenticated user jekyll", async () => {
//   const session = getSession(IDs.jekyll);
//   await teamAPI.getTeamsProjects().expectJson({
//     id: session.session.identity.id,
//     name: session.session.identity.traits.name,
//     avatar: session.session.identity.traits.avatar,
//     email: session.session.identity.traits.email,
//   });
// });
