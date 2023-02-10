export interface Snapshot {
  id: string;
  name: string;
  intent: string;
}

export function createBuild(snapshots: Snapshot) {
  return fetch("http://localhost:3000/api/build/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(snapshots),
  }).then((res) => res.json());
}
