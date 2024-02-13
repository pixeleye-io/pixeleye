import { API } from "@pixeleye/cli-api";
import { Config } from "@pixeleye/cli-config";
import ora from "ora";

export async function ping(options: Config) {
  const api = API({
    endpoint: options.endpoint!,
    token: options.token,
  });

  const pingSpinner = ora("Pinging Pixeleye API").start();

  await api.get("/v1/ping", {}).catch((err) => {
    pingSpinner.fail("Pixeleye API is not reachable");
    console.log(err);
    throw err;
  });

  pingSpinner.succeed("Pixeleye API is up and running");
}
