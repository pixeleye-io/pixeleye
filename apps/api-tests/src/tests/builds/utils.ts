import { Build, PartialSnapshot } from "@pixeleye/api";
import { nanoid } from "nanoid";
import { sleep } from "pactum";
import { buildTokenAPI } from "../../routes/build";
import { snapshotTokenAPI } from "../../routes/snapshots";

export interface CreateBuildOptions {
  token: string;
  branch: string;
  sha: string;
  targetParentID?: string;
  targetBuildID?: string;
  parentBuildIDs?: string[];
  expectedBuildStatus?: Build["status"];
  snapshots: {
    hash: string;
    name: string;
    variant?: string;
    target?: string;
    img: Buffer;
  }[];
}

export async function createBuildWithSnapshots({
  token,
  branch,
  sha,
  targetParentID,
  parentBuildIDs,
  expectedBuildStatus,
  targetBuildID,
  snapshots,
}: CreateBuildOptions) {
  let build: Build | undefined;

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

  await Promise.all(
    snapshots.map(async ({ hash, img, name, target, variant }) => {
      let snap: PartialSnapshot | undefined;

      await snapshotTokenAPI
        .uploadSnapshot(hash, token)
        .returns(({ res }: any) => {
          snap = {
            snapID: res.json.id,
            name,
            target,
            variant,
          };
        });

      // TODO - actually upload the image

      await buildTokenAPI.linkSnapshotsToBuild([snap!], build!.id, token);
    })
  );

  await buildTokenAPI.completeBuild(build!.id, token);

  // TODO - when we have websocket support, we can wait for the build to complete
  let counter = 0;
  while (counter < 5) {
    let b: Build | undefined;

    await buildTokenAPI.getBuild(build!.id, token).returns(({ res }: any) => {
      b = res.json;
    });

    if (b?.status === expectedBuildStatus) {
      break;
    } else if (b?.status !== "processing") {
      throw new Error(
        `Build did not complete with correct status: ${b?.status}`
      );
    }

    await sleep(1000);
    counter++;
  }

  if (counter === 10) {
    throw new Error("Build did not complete");
  }

  return build!;
}
