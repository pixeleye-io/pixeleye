import { z } from "zod";

export const RepoZod = z.object({
  id: z.string().length(21),
  name: z.string(),
  private: z.boolean(),
  url: z.string().url().optional(),
  description: z.string().optional(),
  lastUpdated: z.string().datetime().optional(),
  defaultBranch: z.string().optional(),
});

export type Repo = z.infer<typeof RepoZod>;
