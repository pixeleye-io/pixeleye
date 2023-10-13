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

  role: z.enum(["admin", "member", "accountant", "owner"]).optional(),
});

export const UserOnTeamZod = UserZod.extend({
  role: z.enum(["admin", "member", "accountant", "owner"]),
  roleSync: z.boolean(),
  type: z.enum(["invited", "git"]),
});

export const TeamUsageZod = z.object({
  teamID: z.string().length(21),
  totalSnapshots: z.number(),
  fromDate: z.string().datetime(),
  toDate: z.string().datetime(),
});

export type TeamUsage = z.infer<typeof TeamUsageZod>;

export type Team = z.infer<typeof TeamZod>;
export type UserOnTeam = z.infer<typeof UserOnTeamZod>;
