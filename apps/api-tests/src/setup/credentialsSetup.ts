import {
  IdentityApi,
  Configuration,
  Identity,
  FrontendApi,
  SuccessfulNativeLogin,
  Session,
} from "@ory/kratos-client";
import { env } from "../env";
import {
  JohnSmithsPassword,
  createJohnSmithIdentityBody,
} from "../fixtures/account/johnSmith";

let oryIdentityAPI: IdentityApi | undefined = undefined;

let oryAuthAPI: FrontendApi | undefined = undefined;

function getOryIdentityAPI(): IdentityApi {
  if (oryIdentityAPI) {
    return oryIdentityAPI;
  }
  oryIdentityAPI = new IdentityApi(
    new Configuration({
      accessToken: env.ORY_API_KEY,
    }),
    env.ORY_ENDPOINT
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
    env.ORY_ENDPOINT
  );
  return oryAuthAPI;
}

// Requires an ory api key
async function createOryIdentity() {
  const api = getOryIdentityAPI();

  const identity = await api.createIdentity({
    createIdentityBody: createJohnSmithIdentityBody,
  });

  return identity;
}

async function createOrySession(identity: Identity) {
  const api = getOryAuthAPI();

  const flow = await api.createNativeLoginFlow();

  const session = await fetch(
    `${env.ORY_ENDPOINT}/self-service/login?${new URLSearchParams({
      flow: flow.data.id,
    })}`,
    {
      body: JSON.stringify({
        identifier: identity.traits.email,
        method: "password",
        password: JohnSmithsPassword,
      }),
      method: "POST",
    }
  ).then((res) => res.json() as Promise<SuccessfulNativeLogin>);

  return session;
}
const identityCache = new Map<string, Identity>();

export const IDs = {
  jekyll: "jekyll",
  hyde: "hyde",
} as const;

export type IDs = (typeof IDs)[keyof typeof IDs];

export async function getOryIdentityId(
  id: IDs = IDs.jekyll
): Promise<Identity> {
  if (identityCache.has(id)) {
    return identityCache.get(id)!;
  }

  const identity = await createOryIdentity().then((res) => res.data);

  identityCache.set(id, identity);

  return identity;
}

const sessionCache = new Map<string, SuccessfulNativeLogin>();

export async function getAuthSession(
  id: IDs = IDs.jekyll
): Promise<SuccessfulNativeLogin> {
  if (sessionCache.has(id)) {
    return sessionCache.get(id)!;
  }

  const identity = await getOryIdentityId(id);

  const session = await createOrySession(identity);

  sessionCache.set(id, session);

  return session;
}
