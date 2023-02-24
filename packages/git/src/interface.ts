import { prisma } from "@pixeleye/db";
import { getGithubProvider } from "./providers/github";
import { GitProvider } from "./providers/types";

export async function getGitProvider(sourceId: string): Promise<GitProvider> {
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  switch (source?.type) {
    case "GITHUB":
      return getGithubProvider(source.githubInstallId!);
    default:
      throw new Error("Unknown git provider");
  }
}
