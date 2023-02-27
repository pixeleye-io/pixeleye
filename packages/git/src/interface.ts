import { Source } from "@pixeleye/db";
import { getGithubProvider } from "./providers/github";
import { GitProvider } from "./providers/types";

export async function getGitProvider(source: Source): Promise<GitProvider> {
  switch (source?.type) {
    case "GITHUB":
      return getGithubProvider(source.githubInstallId!);
    default:
      throw new Error("Unknown git provider");
  }
}
