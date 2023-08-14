import { z } from "zod";

export const SnapshotZod = z.object({
  id: z.string().length(21),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  buildID: z.string().length(21),
  snapID: z.string().length(21),

  name: z.string(),
  variant: z.string().optional(),
  target: z.string().optional(),
  viewport: z.string().optional(),

  baselineID: z.string().length(21).optional(),

  reviewerID: z.string().optional(),
  reviewAt: z.string().datetime().optional(),

  status: z.enum([
    "processing",
    "failed",
    "aborted",
    "approved",
    "rejected",
    "unreviewed",
    "unchanged",
    "orphaned",
  ]),
});

export type Snapshot = z.infer<typeof SnapshotZod>;

export type PartialSnapshot = Pick<
  Snapshot,
  "snapID" | "name" | "variant" | "target" | "viewport"
>;
