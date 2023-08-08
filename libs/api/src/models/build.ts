import { z } from "zod";

export const BuildZod = z.object({
  id: z.string().length(21),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  projectID: z.string().length(21),
  buildNumber: z.number().int(),

  targetParentID: z.string().length(21).optional(),
  parentBuildIDs: z.array(z.string().length(21)).optional(),

  targetBuildID: z.string().length(21).optional(),

  sha: z.string(),
  branch: z.string(),
  message: z.string().optional(),
  title: z.string().optional(),
  status: z.enum(["uploading", "uploaded", "failed"]),
  errors: z.array(z.string()),
});

export type Build = z.infer<typeof BuildZod>;
