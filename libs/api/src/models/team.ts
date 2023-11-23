import { z } from "zod";
import { UserZod } from "./user";

export const TeamZod = z.object({
  id: z.string().length(21),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  type: z.enum(["github", "gitlab", "bitbucket", "user"]),

  name: z.string(),
  url: z.string().url().optional(),
  avatarURL: z.string().url().optional(),

  billingStatus: z
    .enum(["active", "inactive", "past_due", "canceled", "not_created"])
    .default("not_created"),
  billingAccountID: z.string().optional(),

  hasInstall: z.boolean().optional(),

  role: z.enum(["admin", "member", "accountant", "owner"]).optional(),
});

export const TeamPlanZod = z.object({
  name: z.string(),
  priceID: z.string(),
  productID: z.string(),
  default: z.boolean(),
  pricing: z.array(
    z.object({
      price: z.number(),
      from: z.number(),
      to: z.number().optional(),
    })
  ).optional(),
});

export const UserOnTeamZod = UserZod.extend({
  role: z.enum(["admin", "member", "accountant", "owner"]),
  roleSync: z.boolean(),
  type: z.enum(["invited", "git"]),
});

export type Team = z.infer<typeof TeamZod>;
export type UserOnTeam = z.infer<typeof UserOnTeamZod>;
export type TeamPlan = z.infer<typeof TeamPlanZod>;
