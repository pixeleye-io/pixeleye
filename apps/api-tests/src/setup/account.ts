import { writeFile } from "fs/promises";
import { createAllSessions, deleteUsers } from "./credentialsSetup";
import { fetch } from "undici";
import * as url from "url";

// TODO - ping the API to check if it's up before running tests

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const setup = async () => {
  const tokens = await createAllSessions();

  await writeFile(
    __dirname + "/../fixtures/sessions.json",
    JSON.stringify(tokens)
  );

  let counter = 0;
  let isUp = false;

  for (let i = 0; i < 100; i++) {
    await fetch("http://127.0.0.1:5000/v1/ping", {
      method: "GET",
    })
      .then(async (res) => {
        console.log(res)
        if (res.status === 200) {
          isUp = true;
          return;
        }
      })
      .catch((err) => {
        console.log(err);
      });

    if (isUp) {
      break;
    }


    console.log("Waiting for API to be up...")
    await new Promise((resolve) => setTimeout(resolve, 1000));
    counter++;
  }

  return async () => {
    await deleteUsers(tokens);
  };
};

export default setup;
