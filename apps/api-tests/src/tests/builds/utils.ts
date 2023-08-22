import { Build, PartialSnapshot } from "@pixeleye/api";
import { sleep } from "pactum";
import { buildTokenAPI } from "../../routes/build";
import { snapshotTokenAPI } from "../../routes/snapshots";
import { fetch, request } from "undici";
import EventSource from "eventsource";
import { env } from "../../env";

export interface CreateBuildOptions {
  build?: Build;
  token: string;
  branch: string;
  sha: string;
  targetParentID?: string;
  targetBuildID?: string;
  parentBuildIDs?: string[];
  expectedBuildStatus: Build["status"][];
  snapshots: {
    hash: string;
    name: string;
    variant?: string;
    target?: string;
    img: Buffer;
  }[];
}

async function waitForBuildStatus(
  token: string,
  build: Build | undefined,
  statuses: Build["status"][]
) {
  return new Promise<void>((resolve, reject) => {
    const es = new EventSource(
      `${env.SERVER_ENDPOINT}/v1/client/builds/${build?.id}/events`,
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      }
    );
    let nextStatus = statuses.shift();
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "build_status") {
        const newStatus = data.data.status;

        if (nextStatus === newStatus) {
          if (statuses.length === 0) {
            es.close();
            resolve();
          } else {
            nextStatus = statuses.shift();
          }
        } else {
          reject(
            new Error(
              `Build status was ${newStatus} but expected ${nextStatus}`
            )
          );
        }
      }
    };

    es.onerror = (err) => {
      reject(err);
    };
  });
}

export async function createBuildWithSnapshots({
  build,
  token,
  branch,
  sha,
  targetParentID,
  parentBuildIDs,
  expectedBuildStatus,
  targetBuildID,
  snapshots,
}: CreateBuildOptions) {
  if (build === undefined) {
    await buildTokenAPI
      .createBuild(token, {
        branch,
        sha,
        targetParentID,
        parentBuildIDs,
        targetBuildID,
      })
      .returns(({ res }: any) => {
        build = res.json;
      });
  }

  const snaps = await Promise.all(
    snapshots.map(
      async ({
        hash,
        img,
        name,
        target,
        variant,
      }): Promise<PartialSnapshot> => {
        let snap: PartialSnapshot | undefined;

        let presigned: any;

        await snapshotTokenAPI
          .uploadSnapshot(hash, 100, 100, token)
          .returns(({ res }: any) => {
            snap = {
              snapID: res.json[hash].id,
              name,
              target,
              variant,
            };
            presigned = res.json[hash];
          });

        if (presigned.URL) {
          const blob = new Blob([img], { type: "image/png" });

          await fetch(presigned.URL, {
            method: presigned.Method,
            headers: {
              ...(presigned.SignedHeader
                ? { Host: presigned.SignedHeader.Host.join(",") }
                : {}),
              contentType: "image/png",
            },
            body: blob,
          });
        }

        return snap!;
      }
    )
  );

  console.log("HIII asdf");

  const buildPromise = waitForBuildStatus(
    token,
    build,
    expectedBuildStatus
  ).catch((err) => {
    throw err;
  });

  await Promise.all(
    snaps.map(
      async (snap) =>
        await buildTokenAPI.linkSnapshotsToBuild([snap!], build!.id, token)
    )
  );

  console.log("HIII 3221asdf");


  buildTokenAPI.completeBuild(build!.id, token);

  await buildPromise;

  console.log("HIII 3221asd 2222222222f");


  return build!;
}
