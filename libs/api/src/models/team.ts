import { z } from "zod";

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

export type Team = z.infer<typeof TeamZod>;
