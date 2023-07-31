import {
  IdentityApi,
  Configuration,
  Identity,
  FrontendApi,
  Session,
  SuccessfulNativeLogin,
} from "@ory/kratos-client";
import { env } from "../env";
import {
  JohnSmithsPassword,
  createJohnSmithIdentityBody,
} from "../fixtures/account/johnSmith";
import { fetch } from "undici";

let oryIdentityAPI: IdentityApi | undefined = undefined;

let oryAuthAPI: FrontendApi | undefined = undefined;

export function getOryIdentityAPI(): IdentityApi {
  if (oryIdentityAPI) {
    return oryIdentityAPI;
  }
  oryIdentityAPI = new IdentityApi(
    new Configuration({
      apiKey: env.ORY_API_KEY,
      accessToken: env.ORY_API_KEY,
    }),
    env.ORY_TEST_ENDPOINT || env.ORY_ENDPOINT
  );

  return oryIdentityAPI;
}

function getOryAuthAPI(): FrontendApi {
  if (oryAuthAPI) {
    return oryAuthAPI;
  }
  oryAuthAPI = new FrontendApi(
    new Configuration({
      accessToken: env.ORY_API_KEY,
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
        Authorization: env.ORY_API_KEY,
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
  const sessions: Record<string, SuccessfulNativeLogin> = {};

  await Promise.all(
    Object.values(IDs).map(async (id) => {
      if (id === IDs.public) {
        sessions[id] = {
          session_token: "",
          session: {
            id: "",
            identity: {
              id: "",
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

      sessions[id] = session;
    })
  );

  return sessions;
}

export function getCreatedUsers(): Identity[] {
  return Array.from(identityCache).map(([, identity]) => identity);
}

// Delete user accounts created during tests
export async function deleteUsers(sessions: Record<IDs, SuccessfulNativeLogin>) {

  const api = getOryIdentityAPI();

  await Promise.all(
    Object.values(sessions).map(async ({ session }) => {
      if (!session.identity.id) {
        return;
      }
      console.log("Deleting user", session.identity.id);
      return api.deleteIdentity({ id: session.identity.id });
    })
  );
}
