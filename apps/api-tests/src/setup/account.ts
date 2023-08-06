import { writeFile } from "fs/promises";
import { createAllSessions, deleteUsers } from "./credentialsSetup";
import waitOn from "wait-on";
import * as url from "url";

// TODO - ping the API to check if it's up before running tests

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const setup = async () => {
  const tokens = await createAllSessions();

  await writeFile(
    __dirname + "/../fixtures/sessions.json",
    JSON.stringify(tokens)
  );

  await waitOn({
    resources: ["http://localhost:5000/v1/ping"],
    timeout: 200_000,
  });

  return async () => {
    await deleteUsers(tokens);
  };
};

export default setup;
