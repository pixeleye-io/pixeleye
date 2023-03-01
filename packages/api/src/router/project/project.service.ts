import crypto from "crypto";
import { PrismaClient } from "@pixeleye/db";
import bcryptjs from "bcryptjs";
import { z } from "zod";

export function generateSecret() {
  return crypto.randomBytes(48).toString("hex");
}

export const createProjectInput = z.object({
  name: z.string(),
  type: z.enum(["GITHUB", "GITLAB", "BITBUCKET", "OTHER"]),
  url: z.string().optional(),
  teamId: z.string().optional(),
  github: z
    .object({
      gitId: z.string(),
      installId: z.string(),
    })
    .optional(),
});

export interface CreateProjectOutput {
  secret: string;
  key: string;
  id: string;
}

export async function createGithubProject(
  prisma: PrismaClient,
  userId: string,
  input: z.infer<typeof createProjectInput>,
): Promise<CreateProjectOutput> {
  const rawSecret = generateSecret();
  const secret = bcryptjs.hashSync(rawSecret);
  const project = await prisma.project.create({
    data: {
      name: input.name,
      url: input.url,
      secret,
      source: {
        connectOrCreate: {
          where: {
            githubInstallId: input.github!.installId,
          },
          create: {
            githubInstallId: input.github!.installId,
            type: input.type,
            gitId: input.github!.gitId,
          },
        },
      },
      Team: {
        connect: {
          id: input.teamId,
        },
      },
      gitId: input.github!.gitId,
      users: {
        create: {
          userId,
          role: "OWNER",
          type: "ADMIN",
        },
      },
    },
  });

  return {
    secret: rawSecret,
    key: project.key,
    id: project.id,
  };
}
