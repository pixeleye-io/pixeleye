import { Team, Project, Build, PartialSnapshot } from "@pixeleye/api";
import { ProjectBody, teamAPI } from "../../routes/team";
import { usersAPI } from "../../routes/users";
import { buildTokenAPI } from "../../routes/build";
import { IDs } from "../../setup/credentialsSetup";
import { like, eachLike } from "pactum-matchers";
import { snapshotTokenAPI } from "../../routes/snapshots";
import { nanoid } from "nanoid";
import { describe, beforeAll, it } from "vitest";

const projectData: ProjectBody = {
  name: "Some project for testing",
  url: "https://pixeleye.sh",
  source: "custom",
};

describe("Creating a build", () => {
  let jekyllTeams: Team[];

  let jekyllsProject: Project;

  let jekyllsToken: string;

  let jekyllsInvalidToken: string;

  let firstMainBuild: Build;
  let firstDevBuild: Build;

  beforeAll(async () => {
    jekyllTeams = await usersAPI
      .getUsersTeams(IDs.jekyll)
      .returns(({ res }) => {
        return res.json;
      });

    const jekyllsPersonalTeam = jekyllTeams.find(
      (team) => team.type === "user" && team.role === "owner"
    )!;

    jekyllsProject = await teamAPI
      .createTeamProject(projectData, jekyllsPersonalTeam.id, IDs.jekyll)
      .returns(({ res }) => {
        return res.json;
      });

    jekyllsToken = `${jekyllsProject.id}:${jekyllsProject.token}`;

    // We want to ensure we're using the correct project id in our token
    jekyllsInvalidToken = jekyllsToken.replace(
      /.$/,
      jekyllsToken.slice(-1) === "a" ? "b" : "a"
    );
  });

  it("Should be able to upload a build", async () => {
    const buildData = {
      branch: "main",
      sha: "1234",
    };
    await buildTokenAPI
      .createBuild(jekyllsToken, buildData)
      .expectJsonMatchStrict({
        id: like("1234"),
        createdAt: like("2021-01-01T00:00:00.000Z"),
        updatedAt: like("2021-01-01T00:00:00.000Z"),
        projectID: jekyllsProject.id,
        buildNumber: like(1),
        sha: "1234",
        branch: "main",
        status: "uploading",
      })
      .returns(({ res }: any) => {
        firstMainBuild = res.json as Build;
      });
  });

  it("Should be able to get build", async () => {
    await buildTokenAPI
      .getBuild(firstMainBuild.id, jekyllsToken)
      .expectJsonMatchStrict(firstMainBuild);
  });

  it("Should not be able to get build with invalid token", async () => {
    await buildTokenAPI.getBuild(firstMainBuild.id, jekyllsInvalidToken, 401);
  });

  it("Should be able to upload a build with extra data", async () => {
    const buildData = {
      branch: "dev",
      sha: "4321",
      message: "Some commit message",
      title: "Some commit title",
    };
    await buildTokenAPI
      .createBuild(jekyllsToken, buildData)
      .expectJsonMatchStrict({
        id: like("1234"),
        createdAt: like("2021-01-01T00:00:00.000Z"),
        updatedAt: like("2021-01-01T00:00:00.000Z"),
        projectID: jekyllsProject.id,
        buildNumber: like(1),
        sha: "4321",
        branch: "dev",
        message: "Some commit message",
        title: "Some commit title",
        status: "uploading",
      })
      .returns(({ res }: any) => {
        firstDevBuild = res.json as Build;
      });
  });

  it("Invalid Token should not work", async () => {
    const buildData = {
      branch: "main",
      sha: "1234",
    };
    await buildTokenAPI.createBuild(jekyllsInvalidToken, buildData, 401);
  });

  // TODO - we need to have a build which has finished uploading
  it.skip("Should be able to search builds with branch", async () => {
    await buildTokenAPI
      .searchBuilds(jekyllsToken, { branch: "main" })
      .expectJsonMatch([firstMainBuild]);

    await buildTokenAPI
      .searchBuilds(jekyllsToken, { branch: "dev" })
      .expectJsonMatch([firstDevBuild]);

    await buildTokenAPI
      .searchBuilds(jekyllsToken, { branch: "dev2" })
      .expectJsonMatch([]);
  });

  it.skip("should be able to search builds with shas", async () => {
    await buildTokenAPI
      .searchBuilds(jekyllsToken, { shas: ["1234"] })
      .expectJsonMatch([firstMainBuild]);

    await buildTokenAPI
      .searchBuilds(jekyllsToken, { shas: ["4321"] })
      .expectJsonMatch([firstDevBuild]);

    await buildTokenAPI
      .searchBuilds(jekyllsToken, { shas: ["4321", "1234"] })
      .expectJsonMatch([firstDevBuild]);

    await buildTokenAPI
      .searchBuilds(jekyllsToken, { shas: ["43241"] })
      .expectJsonMatch([]);
  });

  it("should not be able to search builds with an invalid token", async () => {
    await buildTokenAPI.searchBuilds(jekyllsInvalidToken, {}, 401);
  });

  it("should not allow searching with more than 128 shas", async () => {
    const shas = Array.from({ length: 129 }, (_, i) => i.toString());

    await buildTokenAPI.searchBuilds(jekyllsToken, { shas }, 400);
  });

  // TODO - test bulk uploads
  it("Should be able to upload a snapshot", async () => {
    const hash = nanoid(64);

    await snapshotTokenAPI
      .uploadSnapshot(hash, 100, 100, jekyllsToken)
      .expectJsonMatch({
        [hash]: {
          hash,
          id: like("123"),
          createdAt: like("2023-08-08T16:30:52.207Z"),
          projectID: jekyllsProject.id,
          URL: like("pixeleye.sh"),
          Method: "PUT",
          SignedHeader: {
            Host: eachLike("pixeleye.sh"),
          },
        },
      });
  });

  it("should not let me upload with an invalid sha", async () => {
    await snapshotTokenAPI.uploadSnapshot("adsf", 100, 100, jekyllsToken, 400);
  });

  it("should let me link a snapshot to a build", async () => {
    const hash = nanoid(64);

    let snap: PartialSnapshot | undefined;

    await snapshotTokenAPI
      .uploadSnapshot(hash, 100, 100, jekyllsToken)
      .expectJsonMatch({
        [hash]: {
          hash,
          id: like("123"),
          createdAt: like("2023-08-08T16:30:52.207Z"),
          projectID: jekyllsProject.id,
          URL: like("pixeleye.sh"),
          Method: "PUT",
          SignedHeader: {
            Host: eachLike("pixeleye.sh"),
          },
        },
      })
      .returns(({ res }: any) => {
        snap = {
          name: "button",
          snapID: res.json[hash].id,
        };
      });

    await buildTokenAPI
      .linkSnapshotsToBuild([snap!], firstDevBuild.id, jekyllsToken)
      .expectJsonMatch({
        message: "snapshots queued for processing",
      });
  });

  it("Should be able to complete a build", async () => {
    await buildTokenAPI
      .completeBuild(firstDevBuild.id, jekyllsToken)
      .expectJsonMatch({
        status: "orphaned",
      });
  });
});
