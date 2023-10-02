import { z } from "zod";

export const InviteZod = z.object({
  id: z.string().length(21),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  inviterEmail: z.string().email(),
  inviterName: z.string(),
  inviterAvatarURL: z.string().url(),
  projectName: z.string(),
  teamAvatarURL: z.string().url(),
  teamName: z.string(),
});

export type Invite = z.infer<typeof InviteZod>;
