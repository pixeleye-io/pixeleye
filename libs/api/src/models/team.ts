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

  customerID: z.string().optional(),
  planID: z.string().optional(),

  snapshotLimit: z.number().optional(),

  billingStatus: z
    .enum([
      "active",
      "incomplete",
      "incomplete_expired",
      "past_due",
      "canceled",
      "unpaid",
      "not_created",
    ])
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
  pricing: z
    .array(
      z.object({
        price: z.number(),
        from: z.number(),
        to: z.number().optional(),
      })
    )
    .optional(),
});

export const UserOnTeamZod = UserZod.extend({
  role: z.enum(["admin", "member", "accountant", "owner"]),
  roleSync: z.boolean(),
  type: z.enum(["invited", "git"]),
});

export const Subscription = z.object({
  id: z.string(),
  status: z.enum([
    "incomplete",
    "incomplete_expired",
    "active",
    "past_due",
    "canceled",
    "unpaid",
  ]),
  cancelAt: z.number().optional(),
});

export type UserOnTeamRole = z.infer<typeof UserOnTeamZod>["role"];
export type Subscription = z.infer<typeof Subscription>;
export type Team = z.infer<typeof TeamZod>;
export type UserOnTeam = z.infer<typeof UserOnTeamZod>;
export type TeamPlan = z.infer<typeof TeamPlanZod>;
