import { z } from "zod";
import { UserZod } from "./user";

export const ProjectZod = z.object({
  id: z.string().length(21),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  teamID: z.string().length(21),

  name: z.string(),
  url: z.string().url().optional(),
  source: z.enum(["github", "gitlab", "bitbucket", "custom"]),
  sourceID: z.string().optional(),
  token: z.string().optional(),

  lastActivity: z.string().datetime().optional(),

  role: z.enum(["admin", "reviewer", "viewer"]).optional(),
  teamRole: z.enum(["admin", "member", "accountant", "owner"]).optional(),
});

export const UserOnProjectZod = UserZod.extend({
  role: z.enum(["admin", "reviewer", "viewer"]),
  roleSync: z.boolean(),
});

export type Project = z.infer<typeof ProjectZod>;
export type UserOnProject = z.infer<typeof UserOnProjectZod>;
