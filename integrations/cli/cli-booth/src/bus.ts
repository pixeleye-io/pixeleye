import { PartialSnapshot } from "@pixeleye/api";
import { API, uploadSnapshots } from "@pixeleye/cli-api";

export type QueuedSnap = Omit<PartialSnapshot, "snapID"> & {
  file: Buffer;
  format: "png";
};

const queuedSnaps: QueuedSnap[] = [];

let timer: NodeJS.Timeout | undefined;

let onEmpty: (() => void) | undefined;

export function registerOnEmpty(cb: () => void) {
  onEmpty = cb;
}

export function queueSnapshot(
  endpoint: string,
  token: string,
  buildID: string,
  snapshot: QueuedSnap
) {
  queuedSnaps.push(snapshot);

  if (!timer) {
    timer = setTimeout(() => handleQueue(endpoint, token, buildID), 5_000);
  }
}

async function handleQueue(endpoint: string, token: string, buildID: string) {
  timer = undefined;
  const snapshots = queuedSnaps.splice(0, Math.min(queuedSnaps.length, 10));

  if (queuedSnaps.length > 0) {
    timer = setTimeout(() => handleQueue(endpoint, token, buildID), 5_000);
  }

  if (snapshots.length === 0) {
    timer = undefined;
    return;
  }

  const api = API({ endpoint, token });

  await uploadSnapshots(endpoint, token, snapshots).then(
    (ids) =>
      ids.length > 0 &&
      api.post("/v1/client/builds/{id}/upload", {
        params: {
          id: buildID,
        },
        body: {
          snapshots: snapshots.map((body, i) => ({
            name: body.name,
            variant: body.variant,
            snapID: ids[i].id,
            target: body.target,
            viewport: body.viewport,
            targetIcon: body.targetIcon,
          })),
        },
      })
  );

  if (queuedSnaps.length === 0 && onEmpty) {
    onEmpty();
  }
}
