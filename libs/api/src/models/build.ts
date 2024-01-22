import { z } from "zod";

export const BuildZod = z.object({
  id: z.string().length(21),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  projectID: z.string().length(21),
  buildNumber: z.number().int(),

  parentIDs: z.array(z.string().length(21)).optional(),
  targetBuildID: z.string().length(21).optional(),

  isLatest: z.boolean().optional(),

  sha: z.string(),
  branch: z.string(),
  message: z.string().optional(),
  title: z.string().optional(),
  status: z.enum([
    "uploading",
    "processing",
    "failed",
    "orphaned",
    "aborted",
    "approved",
    "rejected",
    "unreviewed",
    "unchanged",
    "queued-processing",
    "queued-uploading",
  ]),
  errors: z.array(z.string()),
});

export type Build = z.infer<typeof BuildZod>;
