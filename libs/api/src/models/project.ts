import { z } from "zod";

export const ProjectZod = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  name: z.string(),
  sourceID: z.string().optional(),
  source: z.enum(["github", "gitlab", "bitbucket", "custom"]),
  token: z.string(),

  lastActivity: z.string().datetime().optional(),
});

export type Project = z.infer<typeof ProjectZod>;
