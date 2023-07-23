import { z } from "zod";

export const BuildZod = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  projectID: z.string().uuid(),
  buildNumber: z.number().int(),

  parentBuildID: z.string().uuid().optional(),

  sha: z.string(),
  branch: z.string(),
  message: z.string().optional(),
  author: z.string().optional(),
  title: z.string().optional(),
  status: z.enum(["uploading", "uploaded", "failed"]),
  errors: z.array(z.string()),
});

export type Build = z.infer<typeof BuildZod>;
