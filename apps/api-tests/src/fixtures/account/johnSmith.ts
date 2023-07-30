import { CreateIdentityBody } from "@ory/kratos-client";
import { nanoid } from "nanoid";

export const JohnSmithsPassword = nanoid(8);
export const JohnSmithsEmail = `john.smith+${nanoid(8)}@pixeleye.dev`;

export const createJohnSmithIdentityBody: CreateIdentityBody = {
  schema_id: "https://schemas.ory.sh/presets/kratos/identity.email.schema.json",
  traits: {
    email: JohnSmithsEmail,
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
      value: JohnSmithsEmail,
      verified: true,
      status: "completed",
      via: "email",
    },
  ],
};
