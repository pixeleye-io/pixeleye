import { run } from "./src/server.js";

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
