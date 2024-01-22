import { writeFile } from "fs/promises";
import { createAllSessions, deleteUsers } from "./credentialsSetup";
import { fetch } from "undici";
import * as url from "url";
import { env } from "../env";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const setup = async () => {
  let isUp = false;
  for (let i = 0; i < 100; i++) {
    await fetch(env.SERVER_ENDPOINT + "/v1/ping", {
      method: "GET",
    })
      .then(async (res) => {
        if (res.status === 200) {
          isUp = true;
          return;
        }
      })
      .catch((err) => {});

    if (isUp) {
      break;
    }

    console.log("Waiting for API to be up...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (!isUp) {
    throw new Error("API is not up");
  }

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
