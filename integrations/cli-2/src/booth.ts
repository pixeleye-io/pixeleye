import { startServer } from "@pixeleye/booth";
import { Command } from "commander";

export const program = new Command();

program
  .command("start")
  .description("Start the booth server")
  .option("-p, --port <port>", "Port to run the booth server on", "3003")
  .option(
    "-e, --endpoint <endpoint>",
    "Pixeleye API endpoint (only use if self-hosting)",
    "https://api.pixeleye.io"
  )
  .argument("<buildID>", "Build ID to start the booth server for")
  .argument("<token>", "Pixeleye project token")
  .action(async (buildID, token, options) => {
    console.log("token", token);
    console.log("buildID", buildID);
    await startServer({
      port: Number(options.port),
      endpoint: options.endpoint,
      token: token.substring(1, token.length - 1),
      buildID: buildID.substring(1, buildID.length - 1),
    });
  });

export default program.parse(process.argv);
