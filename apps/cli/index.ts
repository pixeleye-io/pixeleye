import { createBuild } from "./src/api";

export async function main() {
  const snapshots = {
    id: "123",
    name: "test-name",
    intent: "test-intent",
  };
  const res = await createBuild(snapshots);
  console.log(res);
}

main();
