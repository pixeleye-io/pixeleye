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

  error: z.string().optional(),

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
    "missing_baseline",
  ]),
});

export type Snapshot = z.infer<typeof SnapshotZod>;

export type PartialSnapshot = Pick<
  Snapshot,
  "snapID" | "name" | "variant" | "target" | "viewport"
>;


export const SnapshotPairZod = SnapshotZod.extend({
  snapHash: z.string().optional(),
  snapURL: z.string().optional(),
  snapHeight: z.number().optional(),
  snapWidth: z.number().optional(),

  baselineHash: z.string().optional(),
  baselineURL: z.string().optional(),
  baselineHeight: z.number().optional(),
  baselineWidth: z.number().optional(),

  diffHash: z.string().optional(),
  diffURL: z.string().optional(),
  diffHeight: z.number().optional(),
  diffWidth: z.number().optional(),
});

export type SnapshotPair = z.infer<typeof SnapshotPairZod>;