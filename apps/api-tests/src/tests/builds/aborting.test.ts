import { Team, Project, Build, SnapshotPair } from "@pixeleye/api";
import { ProjectBody, teamAPI } from "../../routes/team";
import { usersAPI } from "../../routes/users";
import { IDs } from "../../setup/credentialsSetup";
import { nanoid } from "nanoid";
import { describe, beforeAll, it } from "vitest";
import { CreateBuildOptions, createBuildWithSnapshots } from "./utils";
import { buildTokenAPI } from "../../routes/build";
import { like } from "pactum-matchers";
import { sleep } from "pactum";

// TODO - I should add checks to ensure each snapshot has the correct status, not just the build

const projectData: ProjectBody = {
  name: "Some project for testing",
  url: "https://pixeleye.sh",
  source: "custom",
};

const cleanEyePng = Buffer.from(
  "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",
  "base64"
);

describe(
  "Creating a build",
  () => {
    let jekyllTeams: Team[];

    let jekyllsProject: Project;

    let jekyllsToken: string;

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

      jekyllsToken = `${jekyllsProject.token}:${jekyllsProject.id}`;
    });

    it.concurrent(
      "should be able to abort a build",
      async () => {
        let rawBuild1: Build | undefined;
        await buildTokenAPI
          .createBuild(jekyllsToken, {
            branch: "dev asap",
            sha: "123",
          })
          .returns(({ res }: any) => {
            rawBuild1 = res.json;
          });

        await buildTokenAPI.abortBuild(rawBuild1!.id);

        await buildTokenAPI
          .getBuild(rawBuild1!.id, jekyllsToken)
          .expectJsonMatch({
            id: rawBuild1!.id,
            status: "aborted",
          });
      },
      {
        timeout: 120_000,
      }
    );

    it.concurrent(
      "aborted build with dependent builds should have dependent builds target aborted builds target with orphan",
      async () => {
        let rawBuild1: Build | undefined;
        await buildTokenAPI
          .createBuild(jekyllsToken, {
            branch: "dev asap",
            sha: "123",
          })
          .returns(({ res }: any) => {
            rawBuild1 = res.json;
          });

        let rawBuild2: Build | undefined;
        await buildTokenAPI
          .createBuild(jekyllsToken, {
            branch: "dev asap",
            sha: "123",
            parentIDs: [rawBuild1!.id],
          })
          .returns(({ res }: any) => {
            rawBuild2 = res.json;
          });

        await buildTokenAPI.abortBuild(rawBuild1!.id);

        await buildTokenAPI
          .getBuild(rawBuild1!.id, jekyllsToken)
          .expectJsonMatch({
            id: rawBuild1!.id,
            status: "aborted",
          });

        await sleep(5000);

        await buildTokenAPI
          .getBuild(rawBuild2!.id, jekyllsToken)
          .expectJsonMatch({
            id: rawBuild2!.id,
            status: "uploading",
          })
          .returns(({ res }: any) => {
            expect(res.json.parentIDs).toBeUndefined();
          });
      }
    );

    it.concurrent(
      "aborted build with dependent builds should have dependent builds target aborted builds target",
      async () => {
        const snapshots: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "button",
          },
        ];

        const build1 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "main",
          sha: "123",
          expectedBuildStatus: ["orphaned"],
          snapshots,
        }).catch((err) => {
          throw err;
        });

        let rawBuild2: Build | undefined;
        await buildTokenAPI
          .createBuild(jekyllsToken, {
            branch: "dev asap",
            sha: "123",
            parentIDs: [build1.id],
          })
          .returns(({ res }: any) => {
            rawBuild2 = res.json;
          });

        let rawBuild3: Build | undefined;
        await buildTokenAPI
          .createBuild(jekyllsToken, {
            branch: "dev asap",
            sha: "123",
            parentIDs: [rawBuild2!.id],
          })
          .returns(({ res }: any) => {
            rawBuild3 = res.json;
          });

        await buildTokenAPI.abortBuild(rawBuild2!.id);

        await buildTokenAPI
          .getBuild(rawBuild2!.id, jekyllsToken)
          .expectJsonMatch({
            id: rawBuild2!.id,
            status: "aborted",
          });

        await buildTokenAPI
          .getBuild(rawBuild3!.id, jekyllsToken)
          .expectJsonMatch({
            id: rawBuild3!.id,
            status: "uploading",
            parentIDs: [build1.id, rawBuild2!.id],
          });
      }
    );

    // TODO - add tests for updating an aborted builds targets
  },
  {
    retry: 2,
  }
);
