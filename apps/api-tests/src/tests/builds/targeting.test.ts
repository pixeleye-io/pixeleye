import { Team, Project, Build } from "@pixeleye/api";
import { ProjectBody, teamAPI } from "../../routes/team";
import { usersAPI } from "../../routes/users";
import { IDs } from "../../setup/credentialsSetup";
import { describe, beforeAll, it } from "vitest";
import { buildTokenAPI } from "../../routes/build";
import { like } from "pactum-matchers";
import { nanoid } from "nanoid";
import { CreateBuildOptions, createBuildWithSnapshots } from "./utils";

const projectData: ProjectBody = {
  name: "Some project for testing",
  url: "https://pixeleye.sh",
  source: "custom",
};

const cleanEyePng = Buffer.from(
  "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",
  "base64"
);

const dirtyEyePng = Buffer.from(
  "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",
  "base64"
);

describe.concurrent(
  "Build targeting",
  {
    timeout: 200_000,
  },
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

    it("should be able to figure out latest build coming from two orphans", async () => {
      const snapshot1: CreateBuildOptions["snapshots"] = [
        {
          hash: nanoid(40),
          img: cleanEyePng,
          name: "button",
        },
      ];

      const sha1 = nanoid(40);
      const sha2 = nanoid(40);

      const build1 = await createBuildWithSnapshots({
        token: jekyllsToken,
        branch: "test",
        sha: sha1,
        expectedBuildStatus: ["orphaned"],
        snapshots: snapshot1,
      }).catch((err) => {
        throw err;
      });

      const build2 = await createBuildWithSnapshots({
        token: jekyllsToken,
        branch: "test2",
        sha: sha2,
        expectedBuildStatus: ["orphaned"],
        snapshots: snapshot1,
      }).catch((err) => {
        throw err;
      });

      await buildTokenAPI
        .getLatestBuilds([sha1, sha2], jekyllsToken)
        .returns(({ res }: any) => {
          expect((res.json as Build[]).map((b) => b.id).sort()).toEqual(
            [build1.id, build2.id].sort()
          );
        });
    });

    it("should be able to figure out latest build with a mix of orphans and unchanged", async () => {
      const snapshot1: CreateBuildOptions["snapshots"] = [
        {
          hash: nanoid(40),
          img: cleanEyePng,
          name: "button",
        },
      ];

      const sha1 = nanoid(40);
      const sha2 = nanoid(40);
      const sha3 = nanoid(40);
      const sha4 = nanoid(40);

      const build1 = await createBuildWithSnapshots({
        token: jekyllsToken,
        branch: "test",
        sha: sha1,
        expectedBuildStatus: ["orphaned"],
        snapshots: snapshot1,
      }).catch((err) => {
        throw err;
      });

      const build2 = await createBuildWithSnapshots({
        token: jekyllsToken,
        branch: "test2",
        sha: sha2,
        expectedBuildStatus: ["orphaned"],
        snapshots: snapshot1,
      }).catch((err) => {
        throw err;
      });

      const build3 = await createBuildWithSnapshots({
        token: jekyllsToken,
        branch: "test2",
        sha: sha3,
        expectedBuildStatus: ["unchanged"],
        snapshots: snapshot1,
        parentBuildIds: build2.id,
      }).catch((err) => {
        throw err;
      });

      const build4 = await createBuildWithSnapshots({
        token: jekyllsToken,
        branch: "test",
        sha: sha4,
        expectedBuildStatus: ["unchanged"],
        snapshots: snapshot1,
        parentBuildIds: build3.id,
      }).catch((err) => {
        throw err;
      });

      await buildTokenAPI
        .getLatestBuilds([sha1, sha2, sha3], jekyllsToken)
        .returns(({ res }: any) => {
          expect((res.json as Build[]).map((b) => b.id).sort()).toEqual(
            [build1.id, build3.id].sort()
          );
        });

      await buildTokenAPI
        .getLatestBuilds([sha1, sha2], jekyllsToken)
        .returns(({ res }: any) => {
          expect((res.json as Build[]).map((b) => b.id).sort()).toEqual(
            [build1.id, build2.id].sort()
          );
        });

      await buildTokenAPI
        .getLatestBuilds([sha1, sha2, sha3, sha4], jekyllsToken)
        .returns(({ res }: any) => {
          expect((res.json as Build[]).map((b) => b.id).sort()).toEqual(
            [build1.id, build4.id].sort()
          );
        });
    });
  }
);
