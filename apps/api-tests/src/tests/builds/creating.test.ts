import { Team, Project, Build, PartialSnapshot } from "@pixeleye/api";
import { ProjectBody, teamAPI } from "../../routes/team";
import { usersAPI } from "../../routes/users";
import { buildTokenAPI } from "../../routes/build";
import { IDs } from "../../setup/credentialsSetup";
import { like, eachLike } from "pactum-matchers";
import { generateHash } from "@pixeleye/js-sdk";
import { snapshotTokenAPI } from "../../routes/snapshots";

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

  it.only("Should be able to upload a build", async () => {
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
      .expectJsonMatchStrict(firstDevBuild);
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

  it("Should be able to search builds with branch", async () => {
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

  it("should be able to search builds with shas", async () => {
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

  it("Should be able to upload a snapshot", async () => {
    const snapshot = Buffer.from(
      "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",
      "base64"
    );
    const hash = generateHash(snapshot);

    await snapshotTokenAPI.uploadSnapshot(hash, jekyllsToken).expectJsonMatch({
      hash,
      id: like("123"),
      createdAt: like("2023-08-08T16:30:52.207Z"),
      projectID: jekyllsProject.id,
      URL: like("pixeleye.sh"),
      Method: "PUT",
      SignedHeader: {
        Host: eachLike("pixeleye.sh"),
      },
    });
  });

  it("should not let me upload with an invalid sha", async () => {
    await snapshotTokenAPI.uploadSnapshot("adsf", jekyllsToken, 400);
  });

  it.only("should let me link a snapshot to a build", async () => {
    const snapshot = Buffer.from(
      "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",
      "base64"
    );
    const hash = generateHash(snapshot);

    let snap: PartialSnapshot | undefined;

    await snapshotTokenAPI
      .uploadSnapshot(hash, jekyllsToken)
      .expectJsonMatch({
        hash,
        id: like("123"),
        createdAt: like("2023-08-08T16:30:52.207Z"),
        projectID: jekyllsProject.id,
        URL: like("pixeleye.sh"),
        Method: "PUT",
        SignedHeader: {
          Host: eachLike("pixeleye.sh"),
        },
      })
      .returns(({ res }: any) => {
        snap = {
          name: "button",
          snapID: res.json.id,
        };
      });

    await buildTokenAPI
      .linkSnapshotsToBuild([snap!], firstMainBuild.id, jekyllsToken)
      .expectJsonMatch({
        message: "snapshots queued for processing",
      });
      
  });

  it.only("Should be able to complete a build", async () => {
    await buildTokenAPI.completeBuild(firstMainBuild.id, jekyllsToken).expectJsonMatch({
      test: "asdf"
    })

    let finsihed = false;
    let count = 0;
    while (!finsihed && count < 10) {
      await buildTokenAPI
        .getBuild(firstMainBuild.id, jekyllsToken)
        .returns(({ res }: any) => {
          if (res.json.status === "orphaned") {
            finsihed = true;
          } else if (res.json.status !== "processing" && res.json.status !== "uploading") {
            throw new Error(`Build failed, status: ${res.json.status}`);
          }
        });
      count++;
    }
  }, {
    timeout: 1000 * 60 * 5,
  });
});
