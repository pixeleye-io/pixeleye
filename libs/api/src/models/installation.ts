import { z } from "zod";

export const InstallationZod = z.object({
  id: z.string().length(21),
  type: z.enum(["github", "gitlab", "bitbucket"]),
});

export type Installation = z.infer<typeof InstallationZod>;
