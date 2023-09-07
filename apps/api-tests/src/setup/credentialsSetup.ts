import {
  Configuration,
  Identity,
  FrontendApi,
  SuccessfulNativeLogin,
} from "@ory/kratos-client";
import { env } from "../env";
import {
  JohnSmithsPassword,
  createJohnSmithIdentityBody,
} from "../fixtures/account/johnSmith";
import { fetch } from "undici";
import { usersAPI } from "../routes/users";

let oryAuthAPI: FrontendApi | undefined = undefined;

function getOryAuthAPI(): FrontendApi {
  if (oryAuthAPI) {
    return oryAuthAPI;
  }
  oryAuthAPI = new FrontendApi(
    new Configuration({
      accessToken: `bearer ${env.ORY_API_KEY}`,
    }),
    env.ORY_TEST_ENDPOINT || env.ORY_ENDPOINT
  );
  return oryAuthAPI;
}

// Requires an ory api key
async function createOryIdentity(id: IDs = IDs.jekyll) {
  const identity = await fetch(
    (env.ORY_TEST_ENDPOINT || env.ORY_ENDPOINT) + "/admin/identities",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer ${env.ORY_API_KEY}`,
      },
      body: JSON.stringify(createJohnSmithIdentityBody(id)),
    }
  ).then((res) => res.json());

  return identity as Identity;
}

async function createOrySession(identity: Identity) {
  const api = getOryAuthAPI();

  const flow = await api.createNativeLoginFlow();

  const session = await fetch(
    flow.data.ui.action,

    {
      body: JSON.stringify({
        identifier: identity.traits.email,
        method: "password",
        password: JohnSmithsPassword,
      }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  ).then((res) => res.json());

  return session as SuccessfulNativeLogin;
}
const identityCache = new Map<string, Identity>();

export const IDs = {
  jekyll: "jekyll",
  hyde: "hyde",
  public: "public",
  john: "john",
} as const;

export type IDs = (typeof IDs)[keyof typeof IDs];

export async function getOryIdentityId(
  id: IDs = IDs.jekyll
): Promise<Identity> {
  if (identityCache.has(id)) {
    return identityCache.get(id)!;
  }

  const identity = await createOryIdentity(id);

  identityCache.set(id, identity);

  return identity;
}

export async function createAllSessions() {
  const sessions: Record<
    string,
    SuccessfulNativeLogin & {
      session: {
        identity: {
          userID: string;
        };
      };
    }
  > = {};

  await Promise.all(
    Object.values(IDs).map(async (id) => {
      if (id === IDs.public) {
        sessions[id] = {
          session_token: "",
          session: {
            id: "",
            identity: {
              id: "",
              userID: "",
              schema_id: "",
              schema_url: "",
              traits: {},
            },
          },
        };
        return;
      }

      const identity = await getOryIdentityId(id);

      const session = await createOrySession(identity);

      const user: any = await fetch(env.SERVER_ENDPOINT + "/v1/user/me", {
        headers: {
          Authorization: "Bearer " + session.session_token,
        },
      }).then((res) => res.json());

      sessions[id] = {...session, session: {
        ...session.session,
        identity: {
          ...session.session.identity,
          userID: user.id,
        }
      }};
    })
  );

  return sessions;
}

export function getCreatedUsers(): Identity[] {
  return Array.from(identityCache).map(([, identity]) => identity);
}

// Delete user accounts created during tests
export async function deleteUsers(
  sessions: Record<IDs, SuccessfulNativeLogin>
) {
  await Promise.all(
    Object.keys(sessions).map(async (key) => {
      if (key === IDs.public) {
        return;
      }
      console.log("Deleting user", key);
      await usersAPI.deleteUser(key as IDs);
      // TODO - I should have some check here to make sure the user was deleted successfully
    })
  );
}
