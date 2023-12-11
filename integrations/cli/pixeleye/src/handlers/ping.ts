import { API } from "@pixeleye/cli-api";
import ora from "ora";

interface Config {
  token: string;
  url: string;
}

export async function ping(_: unknown, options: Config) {
  const api = API({
    endpoint: options.url,
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
