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
  const START_MQ = process.env.START_MQ || false;

  // Only start db if START_DB is true
  if (!START_MQ) {
    return;
  }

  await $`docker pull rabbitmq:3`;

  const containers = await $`docker ps -a --filter name=rabbitmq-pixeleye`;

  if (containers.stdout.includes("rabbitmq-pixeleye")) {
    await $`docker start rabbitmq-pixeleye`;
  } else {
    await $`docker run --name rabbitmq-pixeleye -e RABBITMQ_DEFAULT_USER=guest -e RABBITMQ_DEFAULT_PASS=guest -d -p 5672:5672 rabbitmq:3`;
  }

  // watch database
  const db = $`docker attach rabbitmq-pixeleye`;

  db.stdout?.on("data", (data) => {
    console.log(data.toString());
  });
}

process.on("exit", () => {
  $`docker stop rabbitmq-pixeleye`;
});

main();
