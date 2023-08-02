import { writeFile } from "fs/promises";
import { createAllSessions, deleteUsers } from "./credentialsSetup";
import * as url from "url";

// TODO - ping the API to check if it's up before running tests

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const setup = async () => {
  const tokens = await createAllSessions();

  await writeFile(
    __dirname + "/../fixtures/sessions.json",
    JSON.stringify(tokens)
  );

  return async () => {
    await deleteUsers(tokens);
  };
};

export default setup;
