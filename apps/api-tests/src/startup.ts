import { CreateIdentityBody, IdentityApi } from "@ory/client";

function CreateIdentity() {
  const identityApi = new IdentityApi();
  const createIdentityBody: CreateIdentityBody = {
    schema_id: "default",
    traits: {
      email: "john.smith@pixeleye.io",
      name: "John Smith",
    },
  };
  const createIdentityRequest = identityApi.createIdentity({
    createIdentityBody,
  });
}
