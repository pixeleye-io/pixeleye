import { z } from "zod";

const BaseSnapshotOptionsZod = z.object({
  viewports: z.array(z.string()),
  targets: z.array(z.string()),
  name: z.string(),
  variant: z.string().optional(),
  fullPage: z.boolean().optional(),
  url: z.string().optional(),
  dom: z.string().optional(),
});

export const SnapshotOptionsZod = BaseSnapshotOptionsZod.and(
  z.union([
    z.object({
      dom: z.string(),
      url: z.undefined(),
    }),
    z.object({
      url: z.string(),
      dom: z.undefined(),
    }),
  ])
);

export type BaseSnapshotOptions = z.infer<typeof BaseSnapshotOptionsZod>;

export type SnapshotOptions = z.infer<typeof SnapshotOptionsZod>;