import { z } from "zod";

export const UserZod = z.object({
  id: z.string().length(21),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string().url(),
  githubId: z.string(),
});

export type User = z.infer<typeof UserZod>;
