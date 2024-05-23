import { CreateIdentityBody } from "@ory/kratos-client";
import { nanoid } from "nanoid";

export const JohnSmithsPassword = nanoid(8);
export const randomId = nanoid(4);
export const getJohnSmithEmail = (id: string) =>
  `john.smith+${randomId}${id}@pixeleye.dev`;

export const createJohnSmithIdentityBody = (id: string): CreateIdentityBody => {
  const email = getJohnSmithEmail(id);
  return {
    schema_id: "",
    state: "active",
    traits: {
      email,
    },
    credentials: {
      password: {
        config: {
          password: JohnSmithsPassword,
        },
      },
    },
    verifiable_addresses: [
      {
        value: email,
        verified: true,
        status: "completed",
        via: "email",
      },
    ],
  };
};
