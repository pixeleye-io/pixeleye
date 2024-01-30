import { cache } from "react";
import { Octokit } from "@octokit/core";

export async function getFile(page: string[]) {
  const path = page.join("/");

  const files = await getAllFiles();

  const file = files.find((f) => f.url === path);

  if (!file) {
    throw new Error("File not found");
  }

  return file;
}

interface GitFolder {
  name: string;
  type: string;
  object: {
    entries: [GitFile];
  };
}

interface GitFile {
  name: string;
  type: string;
  object: {
    text: string;
  };
}

interface GitFiles {
  repository: {
    object: {
      entries: [GitFolder];
    };
  };
}

const octokit = new Octokit({
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  auth: process.env.DOCS_TOKEN,
});

export const getCommitDate = cache(async (name: string) => {
  const commit = await octokit.request("GET /repos/{owner}/{repo}/commits", {
    owner: "pixeleye-io",
    repo: "pixeleye",
    path: `docs/${name}`,
  });

  const date = commit.data[0]?.commit?.committer?.date;

  return date ? new Date(date) : undefined;
});

export const getAllFiles = cache(async () => {
  const gitFiles = await octokit.graphql<GitFiles>(
    `{
      repository(owner: "pixeleye-io", name: "pixeleye") {
        object(expression: "HEAD:docs") {
          ... on Tree {
            entries {
              name
              type
              object {
                ... on Blob {
                  byteSize
                }
                ... on Tree {
                  entries {
                    name
                    type
                    object {
                      ... on Blob {
                        text
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`
  );

  const test = gitFiles.repository.object.entries
    .map((folder) => {
      return folder.object.entries
        .map((file) => {
          return {
            url: [folder.name, file.name]
              .join("/")
              .replace(".md", "")
              .replaceAll(/(\d\d-)/g, ""),
            path: [folder.name, file.name].join("/"),
            githubURL: [
              "https://github.com/pixeleye-io/pixeleye/blob/main/docs",
              folder.name,
              file.name,
            ].join("/"),
            text: file.object.text,
          };
        })
        .flat();
    })
    .flat();

  return test;
});
