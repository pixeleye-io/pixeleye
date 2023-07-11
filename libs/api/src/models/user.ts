import { z } from 'zod';

export const UserZod = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  avatar_url: z.string().url(),
});

export type User = z.infer<typeof UserZod>;