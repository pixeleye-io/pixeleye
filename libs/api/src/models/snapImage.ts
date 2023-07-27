import { z } from "zod";

export const SnapImageZod = z.object({
  id: z.string().length(21),
  createdAt: z.string().datetime(),

  projectID: z.string().length(21),
  hash: z.string().length(64),
});

export type SnapImage = z.infer<typeof SnapImageZod>;

export interface PresignedURL {
  URL: string;
  Method: string;
  SignedHeader: {
    Host: string[];
  };
}
