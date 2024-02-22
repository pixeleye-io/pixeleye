import { startServer } from "@pixeleye/cli-booth";
import { defaultConfig } from "@pixeleye/cli-config";
import { Command } from "commander";

export const program = new Command();

program
  .command("start")
  .description("Start the booth server")
  .option(
    "-p, --port [port]",
    "Port to run the booth server on",
    defaultConfig.boothPort
  )
  .option(
    "-e, --endpoint [endpoint]",
    "Pixeleye API endpoint (only use if self-hosting)",
    defaultConfig.endpoint
  )
  .argument("<buildID>", "Build ID to start the booth server for")
  .argument("<token>", "Pixeleye project token")
  .action(async (buildID, token, options) => {
    await startServer({
      port: Number(options.port),
      endpoint: options.endpoint,
      token: token.substring(1, token.length - 1),
      buildID: buildID.substring(1, buildID.length - 1),
      domEnvironment: options.domEnvironment,
    });
  });

export default program.parse(process.argv);
