import { resolve } from "path";
import { readdir } from "fs/promises";
import { cache } from "react";
import { Octokit } from "@octokit/core";

export async function getFile(page: string[]) {
  const path = page.join("\\");

  const files = await getAllFiles();

  console.log(files);

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
    entries?: [GitFile];
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

export const getAllFiles = cache(async () => {
  // const { token } = createTokenAuth(process.env.GITHUB_DOCS_TOKEN);
  // TODO: add access token
  const octokit = new Octokit({
    auth: process.env.GITHUB_DOCS_TOKEN,
  });

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
            url: [folder.name, file.name].join("/"),
            text: file.object.text,
          };
        })
        .flat();
    })
    .flat();

  console.log(test);

  return test;
});
