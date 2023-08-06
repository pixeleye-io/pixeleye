import { Team, Project } from "@pixeleye/api";
import { ProjectBody, teamAPI } from "../../routes/team";
import { usersAPI } from "../../routes/users";
import { IDs } from "../../setup/credentialsSetup";

const projectData: ProjectBody = {
    name: "Some project for testing",
    url: "https://pixeleye.sh",
    source: "custom",
  };

describe("Uploading a build", () => {
  let jekyllTeams: Team[];
  let hydeTeams: Team[];

  let jekyllsProject: Project;
  let hydesProject: Project;

  let jekyllsToken: string;
    let hydesToken: string;

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

    jekyllsToken = jekyllsProject.token!;

    hydesToken = hydesProject.token!;
  });

  it("Should be able to upload a build", async () => {
  });

    


});
