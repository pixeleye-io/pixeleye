import { IDs } from "./credentialsSetup";
import * as url from "url";
import { readFileSync } from "fs";
import { SuccessfulNativeLogin } from "@ory/kratos-client";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

let sessionsCache:
  | Record<
      IDs,
      SuccessfulNativeLogin & {
        session: {
          identity: {
            userID: string;
          };
        };
      }
    >
  | undefined;

export function getSessions() {
  if (sessionsCache) {
    return sessionsCache;
  }
  const data = readFileSync(__dirname + "/../fixtures/sessions.json", "utf8");

  const sessions: Record<
    IDs,
    SuccessfulNativeLogin & {
      session: {
        identity: {
          userID: string;
        };
      };
    }
  > = JSON.parse(data);

  sessionsCache = sessions;

  return sessions;
}

export function getSession(id: IDs) {
  const sessions = getSessions();

  return sessions[id];
}
