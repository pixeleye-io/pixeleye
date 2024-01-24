import { Team, Project, Build, SnapshotPair } from "@pixeleye/api";
import { ProjectBody, teamAPI } from "../../routes/team";
import { usersAPI } from "../../routes/users";
import { IDs } from "../../setup/credentialsSetup";
import { nanoid } from "nanoid";
import { describe, beforeAll, it } from "vitest";
import { CreateBuildOptions, createBuildWithSnapshots } from "./utils";
import { buildTokenAPI } from "../../routes/build";
import { sleep } from "pactum";
import { like } from "pactum-matchers";

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

const dirtyEyePng = Buffer.from(
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
      "should create 3 builds with no changes",
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

        const build2 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "main",
          sha: "1234",
          expectedBuildStatus: ["unchanged"],
          parentBuildIds: build1.id,
          snapshots,
        }).catch((err) => {
          throw err;
        });

        await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "main",
          sha: "12345",
          expectedBuildStatus: ["unchanged"],
          parentBuildIds: build2.id,
          snapshots,
        }).catch((err) => {
          throw err;
        });
      },
      {
        timeout: 160_000,
      }
    );

    it.concurrent(
      "should create 3 builds with changes then no changes",
      async () => {
        const snapshot1: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "button",
          },
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "button",
            variant: "hover",
          },
        ];

        const snapshot2: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: dirtyEyePng,
            name: "button",
          },
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "buton",
            variant: "hover",
          },
        ];

        const build1 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "dev",
          sha: "123",
          expectedBuildStatus: ["orphaned"],
          snapshots: snapshot1,
        }).catch((err) => {
          throw err;
        });

        const build2 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "dev",
          sha: "1234",
          expectedBuildStatus: ["unreviewed"],
          parentBuildIds: build1.id,
          snapshots: snapshot2,
        }).catch((err) => {
          throw err;
        });

        await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "dev",
          sha: "12345",
          expectedBuildStatus: ["unreviewed"],
          parentBuildIds: build1.id,
          snapshots: snapshot2,
        }).catch((err) => {
          throw err;
        });
      },
      {
        timeout: 160_000,
      }
    );

    it.concurrent(
      "should create 3 builds with changes then back to the original",
      async () => {
        const snapshot1: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "button",
          },
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "input",
          },
        ];

        const snapshot2: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: dirtyEyePng,
            name: "button",
          },
          snapshot1[1],
        ];

        const build1 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "123",
          expectedBuildStatus: ["orphaned"],
          snapshots: snapshot1,
        }).catch((err) => {
          throw err;
        });

        const build2 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "1234",
          expectedBuildStatus: ["unreviewed"],
          parentBuildIds: build1.id,
          snapshots: snapshot2,
        }).catch((err) => {
          throw err;
        });

        await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "12345",
          expectedBuildStatus: ["unchanged"],
          parentBuildIds: build2.id,
          snapshots: snapshot1,
        }).catch((err) => {
          throw err;
        });
      },
      {
        timeout: 160_000,
      }
    );

    it.concurrent(
      "should create 3 builds which are all queued up asap",
      async () => {
        const snapshot1: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "button",
          },
        ];

        const snapshot2: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: dirtyEyePng,
            name: "button",
          },
        ];

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
            branch: "dev",
            sha: "1234",
            parentIDs: [rawBuild1!.id],
          })
          .returns(({ res }: any) => {
            rawBuild2 = res.json;
          });

        await Promise.all([
          createBuildWithSnapshots({
            build: rawBuild2,
            token: jekyllsToken,
            branch: "dev asap",
            sha: "1234",
            expectedBuildStatus: [
              "queued-processing",
              "processing",
              "unreviewed",
            ],
            parentBuildIds: [rawBuild1!.id],
            snapshots: snapshot2,
          }).catch((err) => {
            throw err;
          }),
          createBuildWithSnapshots({
            token: jekyllsToken,
            branch: "dev asap",
            sha: "12345",
            expectedBuildStatus: [
              "queued-processing",
              "processing",
              "unreviewed",
            ],
            parentBuildIds: [rawBuild2!.id],
            snapshots: snapshot2,
          }).catch((err) => {
            throw err;
          }),
          (async () => {
            // We want to make sure the build above finsihes uploading
            await sleep(5000);
            await createBuildWithSnapshots({
              build: rawBuild1,
              token: jekyllsToken,
              branch: "dev asap",
              sha: "123",
              expectedBuildStatus: ["orphaned"],
              snapshots: snapshot1,
            }).catch((err) => {
              throw err;
            });
          })(),
        ]).catch((err) => {
          throw err;
        });
      },
      {
        timeout: 160_000,
      }
    );

    it.concurrent(
      "should create 3 builds which are all queued up asap and then back to the original",
      async () => {
        const snapshot1: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "button",
          },
        ];

        const snapshot2: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: dirtyEyePng,
            name: "button",
          },
        ];

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
            branch: "dev",
            sha: "1234",
            parentIDs: [rawBuild1!.id],
          })
          .returns(({ res }: any) => {
            rawBuild2 = res.json;
          });

        await Promise.all([
          createBuildWithSnapshots({
            build: rawBuild2,
            token: jekyllsToken,
            branch: "dev asap",
            sha: "1234",
            expectedBuildStatus: [
              "queued-processing",
              "processing",
              "unreviewed",
            ],
            parentBuildIds: [rawBuild1!.id],
            snapshots: snapshot2,
          }).catch((err) => {
            throw err;
          }),
          createBuildWithSnapshots({
            token: jekyllsToken,
            branch: "dev asap",
            sha: "12345",
            expectedBuildStatus: [
              "queued-processing",
              "processing",
              "unchanged",
            ],
            parentBuildIds: rawBuild2!.id,
            snapshots: snapshot1,
          }).catch((err) => {
            throw err;
          }),
          (async () => {
            // We want to make sure the build above finsihes uploading
            await sleep(5000);
            await createBuildWithSnapshots({
              build: rawBuild1,
              token: jekyllsToken,
              branch: "dev asap",
              sha: "123",
              expectedBuildStatus: ["orphaned"],
              snapshots: snapshot1,
            }).catch((err) => {
              throw err;
            });
          })(),
        ]).catch((err) => {
          throw err;
        });
      },
      {
        timeout: 160_000,
      }
    );

    it.concurrent(
      "creates 3 builds each with decreasing number of snapshots",
      async () => {
        const snapshot1: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "button",
          },
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "input",
          },
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "input",
            variant: "hover",
          },
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "input",
            variant: "hover",
            target: "chrome",
          },
        ];

        const snapshot2: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: dirtyEyePng,
            name: "button",
          },
          {
            hash: snapshot1[1].hash,
            img: cleanEyePng,
            name: "input",
          },
          {
            hash: snapshot1[3].hash,
            img: cleanEyePng,
            name: "input",
            variant: "hover",
            target: "chrome",
          },
        ];

        const snapshot3: CreateBuildOptions["snapshots"] = [
          {
            hash: snapshot1[0].hash,
            img: cleanEyePng,
            name: "button",
          },
          {
            hash: snapshot1[2].hash,
            img: cleanEyePng,
            name: "input",
            variant: "hover",
          },
        ];

        const build1 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "123",
          expectedBuildStatus: ["orphaned"],
          snapshots: snapshot1,
        }).catch((err) => {
          throw err;
        });

        const build2 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "1234",
          expectedBuildStatus: ["unreviewed"],
          parentBuildIds: build1.id,
          snapshots: snapshot2,
        }).catch((err) => {
          throw err;
        });

        await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "12345",
          expectedBuildStatus: ["unchanged"],
          parentBuildIds: build2.id,
          snapshots: snapshot3,
        }).catch((err) => {
          throw err;
        });
      },
      {
        timeout: 160_000,
      }
    );

    it.concurrent(
      "should create 3 builds with data then no data",
      async () => {
        const snapshot1: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "button",
          },
        ];

        const build1 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "123",
          expectedBuildStatus: ["orphaned"],
          snapshots: snapshot1,
        }).catch((err) => {
          throw err;
        });

        const build2 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "1234",
          expectedBuildStatus: ["unchanged"],
          parentBuildIds: build1.id,
          snapshots: [],
        }).catch((err) => {
          throw err;
        });

        await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "12345",
          expectedBuildStatus: ["unchanged"],
          parentBuildIds: build2.id,
          snapshots: [],
        }).catch((err) => {
          throw err;
        });
      },
      {
        timeout: 230_000,
      }
    );

    it.concurrent(
      "should create 4 builds with increasingly more snapshots",
      async () => {
        const snapshot1: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "button",
          },
        ];

        const snapshot2: CreateBuildOptions["snapshots"] = [
          {
            hash: snapshot1[0].hash,
            img: cleanEyePng,
            name: "button",
          },
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "input",
          },
        ];

        const snapshot3: CreateBuildOptions["snapshots"] = [
          {
            hash: snapshot2[0].hash,
            img: cleanEyePng,
            name: "button",
          },
          {
            hash: snapshot2[1].hash,
            img: cleanEyePng,
            name: "input",
          },
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "input",
            variant: "hover",
          },
        ];

        const snapshot4: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: dirtyEyePng,
            name: "button",
          },
          {
            hash: snapshot3[1].hash,
            img: cleanEyePng,
            name: "input",
          },
          {
            hash: snapshot3[2].hash,
            img: cleanEyePng,
            name: "input",
            variant: "hover",
          },
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "input",
            variant: "hover",
            target: "chrome",
          },
        ];

        const build1 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "123",
          expectedBuildStatus: ["orphaned"],
          snapshots: snapshot1,
        }).catch((err) => {
          throw err;
        });

        const build2 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "1234",
          expectedBuildStatus: ["unchanged"],
          parentBuildIds: build1.id,
          snapshots: snapshot2,
        }).catch((err) => {
          throw err;
        });

        const build3 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "12345",
          expectedBuildStatus: ["unchanged"],
          parentBuildIds: build2.id,
          snapshots: snapshot3,
        }).catch((err) => {
          throw err;
        });

        await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "123456",
          expectedBuildStatus: ["unreviewed"],
          parentBuildIds: build3.id,
          snapshots: snapshot4,
        }).catch((err) => {
          throw err;
        });
      },
      {
        timeout: 160_000,
      }
    );

    it.concurrent(
      "should create 2 builds with changes, then approve all the snaps in the second build, then create a build with no changes",
      async () => {
        const snapshot1: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: dirtyEyePng,
            name: "button",
          },
        ];

        const snapshot2: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "button",
          },
        ];

        const build1 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "123",
          expectedBuildStatus: ["orphaned"],
          snapshots: snapshot1,
        }).catch((err) => {
          throw err;
        });

        const build2 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "1234",
          expectedBuildStatus: ["unreviewed"],
          parentBuildIds: build1.id,
          snapshots: snapshot2,
        }).catch((err) => {
          throw err;
        });

        await buildTokenAPI
          .approveAllSnapshots(build2.id, IDs.jekyll)
          .returns(({ res }: any) => {
            return res.json;
          });

        await buildTokenAPI
          .getBuild(build2.id, jekyllsToken)
          .expectJsonMatchStrict({
            ...build2,
            status: "approved",
            updatedAt: like("2023-08-08T16:30:52.207Z"),
          });

        await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "12345",
          expectedBuildStatus: ["unchanged"],
          parentBuildIds: build2.id,
          snapshots: snapshot2,
        }).catch((err) => {
          throw err;
        });
      },
      {
        timeout: 160_000,
      }
    );

    it.concurrent(
      "should create 2 builds with changes, then reject all the snaps in the second build, then create a build with the same changes, then a final build using the first snapshot",
      async () => {
        const snapshot1: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: dirtyEyePng,
            name: "button",
          },
        ];

        const snapshot2: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "button",
          },
        ];

        const build1 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "123",
          expectedBuildStatus: ["orphaned"],
          snapshots: snapshot1,
        }).catch((err) => {
          throw err;
        });

        const build2 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "1234",
          expectedBuildStatus: ["unreviewed"],
          parentBuildIds: build1.id,
          snapshots: snapshot2,
        }).catch((err) => {
          throw err;
        });

        await buildTokenAPI
          .rejectAllSnapshots(build2.id, IDs.jekyll)
          .returns(({ res }: any) => {
            return res.json;
          });

        await buildTokenAPI
          .getBuild(build2.id, jekyllsToken)
          .expectJsonMatchStrict({
            ...build2,
            status: "rejected",
            updatedAt: like("2023-08-08T16:30:52.207Z"),
          });

        const build3 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "12345",
          expectedBuildStatus: ["rejected"],
          parentBuildIds: build2.id,
          snapshots: snapshot2,
        }).catch((err) => {
          throw err;
        });

        await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "123456",
          expectedBuildStatus: ["unchanged"],
          parentBuildIds: build3.id,
          snapshots: snapshot1,
        }).catch((err) => {
          throw err;
        });
      },
      {
        timeout: 160_000,
      }
    );

    it.concurrent(
      "should create 2 builds with no changes, then create a build with changes, then approve all snapshots",
      async () => {
        const snapshot1: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "button",
          },
        ];

        const snapshot2: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: dirtyEyePng,
            name: "button",
          },
        ];

        const build1 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "123",
          expectedBuildStatus: ["orphaned"],
          snapshots: snapshot1,
        }).catch((err) => {
          throw err;
        });

        const build2 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "1234",
          expectedBuildStatus: ["unchanged"],
          parentBuildIds: build1.id,
          snapshots: snapshot1,
        }).catch((err) => {
          throw err;
        });

        const build3 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "12345",
          expectedBuildStatus: ["unreviewed"],
          parentBuildIds: build2.id,
          snapshots: snapshot2,
        }).catch((err) => {
          throw err;
        });

        await buildTokenAPI
          .approveAllSnapshots(build3.id, IDs.jekyll)
          .returns(({ res }: any) => {
            return res.json;
          });

        await buildTokenAPI
          .getBuild(build3.id, jekyllsToken)
          .expectJsonMatchStrict({
            ...build3,
            status: "approved",
            updatedAt: like("2023-08-08T16:30:52.207Z"),
          });
      },
      {
        timeout: 160_000,
      }
    );

    it.concurrent(
      "should create 2 builds with no changes, then create a build with changes, then reject 1 of the snapshots. The next build should also be rejected",
      async () => {
        const snapshot1: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "button",
          },
          {
            hash: nanoid(40),
            img: cleanEyePng,
            name: "button",
            variant: "green",
          },
        ];

        const snapshot2: CreateBuildOptions["snapshots"] = [
          {
            hash: nanoid(40),
            img: dirtyEyePng,
            name: "button",
          },
          {
            hash: nanoid(40),
            img: dirtyEyePng,
            name: "button",
            variant: "green",
          },
        ];

        const build1 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "123",
          expectedBuildStatus: ["orphaned"],
          snapshots: snapshot1,
        }).catch((err) => {
          throw err;
        });

        const build2 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "1234",
          expectedBuildStatus: ["unchanged"],
          parentBuildIds: build1.id,
          snapshots: snapshot1,
        }).catch((err) => {
          throw err;
        });

        const build3 = await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "12345",
          expectedBuildStatus: ["unreviewed"],
          parentBuildIds: build2.id,
          snapshots: snapshot2,
        }).catch((err) => {
          throw err;
        });

        const buildSnapshots: SnapshotPair[] = await buildTokenAPI
          .getSnapshots(build3.id, IDs.jekyll)
          .returns(({ res }: any) => {
            return res.json;
          });

        await buildTokenAPI
          .rejectSnapshots([buildSnapshots[0].id], build3.id, IDs.jekyll)
          .returns(({ res }: any) => {
            return res.json;
          });

        await buildTokenAPI
          .getBuild(build3.id, jekyllsToken)
          .expectJsonMatchStrict({
            ...build3,
            status: "unreviewed",
            updatedAt: like("2023-08-08T16:30:52.207Z"),
          });

        await createBuildWithSnapshots({
          token: jekyllsToken,
          branch: "test",
          sha: "123456",
          expectedBuildStatus: ["unreviewed"],
          parentBuildIds: build3.id,
          snapshots: snapshot2,
        }).catch((err) => {
          throw err;
        });
      },
      {
        timeout: 160_000,
      }
    );

    it.concurrent(
      "can abort a build",
      async () => {
        const build = await buildTokenAPI
          .createBuild(jekyllsToken, {
            branch: "test",
            sha: "123",
          })
          .returns(({ res }: any) => {
            return res.json;
          });

        await buildTokenAPI.abortBuild(build.id, IDs.jekyll);

        await buildTokenAPI
          .getBuild(build.id, jekyllsToken)
          .expectJsonMatchStrict({
            ...build,
            status: "aborted",
            updatedAt: like("2023-08-08T16:30:52.207Z"),
          });
      },
      {
        timeout: 160_000,
      }
    );

    it.concurrent(
      "can't abort a build thats already finished",
      async () => {
        const build = await buildTokenAPI
          .createBuild(jekyllsToken, {
            branch: "test",
            sha: "123",
          })
          .returns(({ res }: any) => {
            return res.json;
          });

        await buildTokenAPI.completeBuild(build.id, jekyllsToken);

        await buildTokenAPI.abortBuild(build.id, IDs.jekyll, 400);
      },
      {
        timeout: 160_000,
      }
    );
  },
  {
    retry: 2,
  }
);
