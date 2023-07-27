import { $, ExecaReturnValue, execaCommandSync } from "execa";
import env from "dotenv";
import * as url from "url";
import { join } from "path";
import isPortReachable from "is-port-reachable";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

env.configDotenv({
  path: join(__dirname, "../../.env"),
});

export async function main() {
  const START_DB = process.env.START_DB || false;

  // Only start db if START_DB is true
  if (!START_DB) {
    return;
  }

  await $`docker pull postgres:15`;

  const containers = await $`docker ps -a --filter name=postgres-pixeleye`;

  if (containers.stdout.includes("postgres-pixeleye")) {
    await $`docker start postgres-pixeleye`;
  } else {
    await $`docker run --name postgres-pixeleye -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pixeleye -e POSTGRES_USER=postgres -d -p 5432:5432 postgres:15`;
  }

  // Wait for postgres to be ready
  const counter = 0;
  while (counter < 30) {
    if (await isPortReachable(5432, { host: "localhost" })) break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const platformPath = join(__dirname, "../../apps/backend/platform").replace(
    /\\/g,
    "/"
  );

  // run database migrations
  await $`docker pull arigaio/atlas`;
  await $`docker run -v ${`${platformPath}/:/platform/`} --rm --net=host arigaio/atlas migrate apply --dir ${"file://platform/migrations"} --url ${"postgres://postgres:postgres@localhost:5432/pixeleye?sslmode=disable"} --revisions-schema public`.catch(
    (e) => e
  );

  // watch database
  const db = $`docker attach postgres-pixeleye`;

  db.stdout?.on("data", (data) => {
    console.log(data.toString());
  });
}

process.on("exit", () => {
  $`docker stop postgres-pixeleye`;
});

main();
