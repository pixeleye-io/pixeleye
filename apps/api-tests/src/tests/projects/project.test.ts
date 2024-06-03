import { ProjectBody, teamAPI } from "../../routes/team";
import { IDs } from "../../setup/credentialsSetup";
import { describe, it, expect } from "vitest";
import { Project, Team } from "@pixeleye/api";
import { usersAPI } from "../../routes/users";
import { like } from "pactum-matchers";
import { projectAPI } from "../../routes/project";
import { handler } from "pactum";

// Ensures that we don't have an access token
handler.addExpectHandler("noToken", (ctx: any) => {
  expect(ctx.res.json.token).to.be.undefined;
});

describe("Team projects", () => {
  let jekyllTeams: Team[];
  let hydeTeams: Team[];

  let jekyllsProject: Project;
  let hydesProject: Project;

  beforeAll(async () => {
    [jekyllTeams, hydeTeams] = await Promise.all([
      usersAPI.getUsersTeams(IDs.jekyll).returns(({ res }) => {
        return res.json;
      }),
      usersAPI.getUsersTeams(IDs.hyde).returns(({ res }) => {
        return res.json;
      }),
    ]);
  });

  it("should create a team project Jekyll", async (ctx) => {
    const userTeam = jekyllTeams.find(
      (team) => team.type === "user" && team.role === "owner"
    )!;

    const project: ProjectBody = {
      name: "test",
      url: "https://pixeleye.dev",
      source: "custom",
    };

    await teamAPI
      .createTeamProject(project, userTeam.id, IDs.jekyll)
      .expectJsonMatch({
        id: like("1234"),
        createdAt: like("2021-01-01T00:00:00.000Z"),
        updatedAt: like("2021-01-01T00:00:00.000Z"),
        teamID: like("1234"),
        name: "test",
        url: "https://pixeleye.dev",
        source: "custom",
        token: like("1234"),
        lastActivity: null,
        role: "admin",
      })
      .returns(({ res }) => {
        jekyllsProject = res.json as Project;
      });
  });

  it("should create a team project Hyde", async (ctx) => {
    const userTeam = hydeTeams.find(
      (team) => team.type === "user" && team.role === "owner"
    )!;

    const project: ProjectBody = {
      name: "Some project",
      url: "https://pixeleye.sh",
      source: "custom",
    };

    await teamAPI
      .createTeamProject(project, userTeam.id, IDs.hyde)
      .expectJsonMatch({
        id: like("1234"),
        createdAt: like("2021-01-01T00:00:00.000Z"),
        updatedAt: like("2021-01-01T00:00:00.000Z"),
        teamID: userTeam.id,
        name: "Some project",
        url: "https://pixeleye.sh",
        source: "custom",
        token: like("1234"),
        lastActivity: null,
        role: "admin",
      })
      .returns(({ res }) => {
        hydesProject = res.json as Project;
      });
  });

  it("Jekyll should be able to access their project", async (ctx) => {
    const userTeam = jekyllTeams.find(
      (team) => team.type === "user" && team.role === "owner"
    )!;

    await projectAPI
      .getProject(jekyllsProject.id, IDs.jekyll)
      .expectJsonMatch({
        id: jekyllsProject.id,
        createdAt: jekyllsProject.createdAt,
        updatedAt: jekyllsProject.updatedAt,
        teamID: userTeam.id,
        name: jekyllsProject.name,
        url: jekyllsProject.url,
        source: jekyllsProject.source,
        lastActivity: null,
        role: "admin",
        teamRole: "owner",
      })
      .expect("noToken");
  });

  it("Hyde should be able to access their project", async (ctx) => {
    const userTeam = hydeTeams.find(
      (team) => team.type === "user" && team.role === "owner"
    )!;

    await projectAPI
      .getProject(hydesProject.id, IDs.hyde)
      .expectJsonMatch({
        id: hydesProject.id,
        createdAt: hydesProject.createdAt,
        updatedAt: hydesProject.updatedAt,
        teamID: userTeam.id,
        name: hydesProject.name,
        url: hydesProject.url,
        source: hydesProject.source,
        lastActivity: null,
        role: "admin",
        teamRole: "owner",
      })
      .expect("noToken");
  });

  it("Jekyll should not be able to access Hyde's project", async (ctx) => {
    const userTeam = hydeTeams.find(
      (team) => team.type === "user" && team.role === "owner"
    )!;

    await projectAPI.getProject(userTeam.id, IDs.jekyll, 404);
  });

  it("Hyde should not be able to access Jekyll's project", async (ctx) => {
    const userTeam = jekyllTeams.find(
      (team) => team.type === "user" && team.role === "owner"
    )!;

    await projectAPI.getProject(userTeam.id, IDs.hyde, 404);
  });
});
