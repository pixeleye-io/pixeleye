import { CreateIdentityBody } from "@ory/kratos-client";
import { nanoid } from "nanoid";

export const JohnSmithsPassword = nanoid(8);
export const randomId = (Math.random() + 1).toString(36).substring(7);
export const getJohnSmithEmail = (id: string) =>
  `john.smith+${randomId}${id}@pixeleye.dev`;

export const createJohnSmithIdentityBody = (id: string): CreateIdentityBody => {
  const email = getJohnSmithEmail(id);
  return {
    schema_id: "",
    state: "active",
    traits: {
      email,
      name: "John Smith",
      avatar: "https://assets.pixeleye.io/some-avatar.png",
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
