import { z } from "zod";
import { UserZod } from "./user";
import { SnapshotZod } from "./snapshot";

export const BaseFeedItemZod = z.object({
  id: z.string().length(21),
  createdAt: z.string().datetime(),
  buildID: z.string().length(21),
  type: z.enum([
    "snapshot_approval",
    "snapshot_rejection",
    "build_approval",
    "build_rejection",
  ]),
  user: z.object({
    id: z.string().length(21),
    avatar: z.string().url().optional(),
    name: z.string(),
  }),
});

export const FeedSnapshotApprovalZod = BaseFeedItemZod.extend({
  type: z.literal("snapshot_approval"),
  attributes: z.object({
    snapshot: SnapshotZod,
  }),
});

export type FeedSnapshotApproval = z.infer<typeof FeedSnapshotApprovalZod>;

export const FeedSnapshotRejection = BaseFeedItemZod.extend({
  type: z.literal("snapshot_rejection"),
  attributes: z.object({
    snapshot: SnapshotZod,
  }),
});

export type FeedSnapshotRejection = z.infer<typeof FeedSnapshotRejection>;

export const FeedBuildApprovalZod = BaseFeedItemZod.extend({
  type: z.literal("build_approval"),
});

export type FeedBuildApproval = z.infer<typeof FeedBuildApprovalZod>;

export const FeedBuildRejectionZod = BaseFeedItemZod.extend({
  type: z.literal("build_rejection"),
});

export type FeedBuildRejection = z.infer<typeof FeedBuildRejectionZod>;

export const FeedItemZod = z.discriminatedUnion("type", [
  FeedSnapshotApprovalZod,
  FeedSnapshotRejection,
  FeedBuildApprovalZod,
  FeedBuildRejectionZod,
]);

export type FeedItem = z.infer<typeof FeedItemZod>;
