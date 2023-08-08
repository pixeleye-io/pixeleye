import { ProjectBody, teamAPI } from "../../routes/team";
import { IDs } from "../../setup/credentialsSetup";
import { describe, it, expect } from "vitest";
import { Project, Team } from "@pixeleye/api";
import { usersAPI } from "../../routes/users";
import { like } from "pactum-matchers";
import { projectAPI } from "../../routes/project";
import { handler } from "pactum";
import { getSession } from "../../setup/getSession";

// Ensures that we don't have an access token
handler.addExpectHandler("noToken", (ctx: any) => {
  expect(ctx.res.json.token).to.be.undefined;
});

const projectData: ProjectBody = {
  name: "Some project for testing",
  url: "https://pixeleye.sh",
  source: "custom",
};

describe.skip("Team admin projects", () => {
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

    const jekyllsPersonalTeam = jekyllTeams.find(
      (team) => team.type === "user" && team.role === "owner"
    )!;
    const hydesPersonalTeam = hydeTeams.find(
      (team) => team.type === "user" && team.role === "owner"
    )!;

    [jekyllsProject, hydesProject] = await Promise.all([
      teamAPI
        .createTeamProject(projectData, jekyllsPersonalTeam.id, IDs.jekyll)
        .returns(({ res }) => {
          return res.json;
        }),
      teamAPI
        .createTeamProject(projectData, hydesPersonalTeam.id, IDs.hyde)
        .returns(({ res }) => {
          return res.json;
        }),
    ]);
  });

  // TODO - check that the updated at date is updated to a value greater than the createdAt date
  it("Jekyll should be able to generate a token for their project", async (ctx) => {
    await projectAPI
      .regenerateToken(jekyllsProject.id, IDs.jekyll)
      .expectJsonMatch({
        id: jekyllsProject.id,
        createdAt: jekyllsProject.createdAt,
        updatedAt: like("2021-01-01T00:00:00.000Z"),
        teamID: jekyllsProject.teamID,
        name: jekyllsProject.name,
        url: jekyllsProject.url,
        source: jekyllsProject.source,
        lastActivity: null,
        role: "admin",
        teamRole: "owner",
        token: like("1234"),
      });
  });

  it("Hyde should be able to generate a token for their project", async (ctx) => {
    await projectAPI
      .regenerateToken(hydesProject.id, IDs.hyde)
      .expectJsonMatch({
        id: hydesProject.id,
        createdAt: hydesProject.createdAt,
        updatedAt: like("2021-01-01T00:00:00.000Z"),
        teamID: hydesProject.teamID,
        name: hydesProject.name,
        url: hydesProject.url,
        source: hydesProject.source,
        lastActivity: null,
        role: "admin",
        teamRole: "owner",
        token: like("1234"),
      });
  });

  it("Jekyll should not be able to generate a token for Hyde's project when not in his project/team", async (ctx) => {
    await projectAPI.regenerateToken(hydesProject.id, IDs.jekyll, 500);
  });

  it("Hyde should not be able to generate a token for Jekyll's project when not in his project/team", async (ctx) => {
    await projectAPI.regenerateToken(jekyllsProject.id, IDs.hyde, 500);
  });

  it("Jekyll should not be able to delete Hyde's project when not in his project/team", async (ctx) => {
    await projectAPI.deleteProject(
      hydesProject.id,
      hydesProject.name,
      IDs.jekyll,
      500
    );
  });

  it("Hyde should not be able to delete Jekyll's project when not in his project/team", async (ctx) => {
    await projectAPI.deleteProject(
      jekyllsProject.id,
      jekyllsProject.name,
      IDs.hyde,
      500
    );
  });

  // -------------------- adding a user to a project --------------------

  it("Jekyll should not be able to add john to their project when not in his project/team", async (ctx) => {
    const { session } = getSession(IDs.john);
    await projectAPI.addUserToProject(
      hydesProject.id,
      session.identity.id,
      "viewer",
      IDs.jekyll,
      500
    );
  });

  it("Jekyll should be able to add Hyde to their project", async (ctx) => {
    const { session } = getSession(IDs.hyde);
    await projectAPI.addUserToProject(
      jekyllsProject.id,
      session.identity.id,
      "viewer",
      IDs.jekyll
    );

    const teams = await usersAPI.getUsersTeams(IDs.hyde).returns(({ res }) => {
      return res.json;
    });
    const team = teams.find((team: Team) => team.id === jekyllsProject.teamID);
    expect(team).to.not.be.undefined;
    expect(team!.role).to.equal("member");
  });

  it("Hyde should be able to add Jekyll to their project", async (ctx) => {
    const { session } = getSession(IDs.jekyll);
    await projectAPI.addUserToProject(
      hydesProject.id,
      session.identity.id,
      "viewer",
      IDs.hyde
    );

    const teams = await usersAPI
      .getUsersTeams(IDs.jekyll)
      .returns(({ res }) => {
        return res.json;
      });

    const team = teams.find((team: Team) => team.id === hydesProject.teamID);
    expect(team).to.not.be.undefined;
    expect(team!.role).to.equal("member");
  });

  it("Hyde should not be able to access admin routes for Jekyll's project when a viewer", async (ctx) => {
    const { session } = getSession(IDs.john);

    await projectAPI.regenerateToken(jekyllsProject.id, IDs.hyde, 401);
    await projectAPI.deleteProject(
      jekyllsProject.id,
      jekyllsProject.name,
      IDs.hyde,
      401
    );
    await projectAPI.addUserToProject(
      jekyllsProject.id,
      session.identity.id,
      "viewer",
      IDs.hyde,
      401
    );
    await projectAPI.updateUserRole(
      jekyllsProject.id,
      session.identity.id,
      "reviewer",
      IDs.hyde,
      401
    );
  });

  it("Jekyll should not be able to access admin routes for Hyde's project when a viewer", async (ctx) => {
    const { session } = getSession(IDs.john);

    await projectAPI.regenerateToken(hydesProject.id, IDs.jekyll, 401);
    await projectAPI.deleteProject(
      hydesProject.id,
      hydesProject.name,
      IDs.jekyll,
      401
    );
    await projectAPI.addUserToProject(
      hydesProject.id,
      session.identity.id,
      "viewer",
      IDs.jekyll,
      401
    );
    await projectAPI.updateUserRole(
      hydesProject.id,
      session.identity.id,
      "reviewer",
      IDs.jekyll,
      401
    );
  });

  it("Jekyll should be able to update hydes role", async (ctx) => {
    const { session } = getSession(IDs.hyde);
    await projectAPI.updateUserRole(
      jekyllsProject.id,
      session.identity.id,
      "reviewer",
      IDs.jekyll
    );
  });

  it("Hyde should be able to update jekylls role", async (ctx) => {
    const { session } = getSession(IDs.jekyll);

    await projectAPI.updateUserRole(
      hydesProject.id,
      session.identity.id,
      "admin",
      IDs.hyde
    );
  });

  it("Hyde should not be able to access Jekylls admin routes when a reviewer", async (ctx) => {
    const { session } = getSession(IDs.john);

    await projectAPI.regenerateToken(jekyllsProject.id, IDs.hyde, 401);
    await projectAPI.deleteProject(
      jekyllsProject.id,
      jekyllsProject.name,
      IDs.hyde,
      401
    );
    await projectAPI.addUserToProject(
      jekyllsProject.id,
      session.identity.id,
      "viewer",
      IDs.hyde,
      401
    );
    await projectAPI.updateUserRole(
      jekyllsProject.id,
      session.identity.id,
      "reviewer",
      IDs.hyde,
      401
    );
  });

  it("Jekyll should be able to access hydes admin routes when also an admin", async (ctx) => {
    const { session } = getSession(IDs.john);

    await projectAPI
      .regenerateToken(hydesProject.id, IDs.jekyll)
      .expectJsonMatch({
        id: hydesProject.id,
        createdAt: hydesProject.createdAt,
        updatedAt: like("2021-01-01T00:00:00.000Z"),
        teamID: hydesProject.teamID,
        name: hydesProject.name,
        url: hydesProject.url,
        source: hydesProject.source,
        lastActivity: null,
        role: "admin",
        teamRole: "owner",
        token: like("1234"),
      });

    await projectAPI.addUserToProject(
      hydesProject.id,
      session.identity.id,
      "viewer",
      IDs.jekyll
    );

    await projectAPI.updateUserRole(
      hydesProject.id,
      session.identity.id,
      "reviewer",
      IDs.jekyll
    );
  });

  // -------------------- deleting a project --------------------

  it("Jekyll should be able to delete their project", async (ctx) => {
    await projectAPI.deleteProject(
      jekyllsProject.id,
      jekyllsProject.name,
      IDs.jekyll
    );
  });

  it("Jekyll should be able to delete their hydes", async (ctx) => {
    await projectAPI.deleteProject(
      hydesProject.id,
      hydesProject.name,
      IDs.jekyll
    );
  });
});
