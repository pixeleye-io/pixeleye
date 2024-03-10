import { cache } from "react";
import { Octokit } from "@octokit/core";
import { Section } from "../docsNav";

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

const transforms: Record<string, string> = {
  "any other platform (cli)": "Any other platform (CLI)",
  "sitemaps and urls": "Sitemaps and URLs",
};

export async function getFiles() {
  const files = await getAllFiles();

  const sections = files.reduce((acc, { url }) => {
    const [section, link] = url.split("/", 2);
    const sectionIndex = acc.findIndex(
      (s) => s.title === section.replaceAll("-", " ")
    );

    const title = link.replaceAll("-", " ");

    const linkObj = {
      title: transforms[title] || title,
      href: `/docs/${url}`,
    };

    if (sectionIndex === -1) {
      return [
        ...acc,
        {
          title: section.replaceAll("-", " "),
          links: [linkObj],
        },
      ];
    }

    return [
      ...acc.slice(0, sectionIndex),
      {
        ...acc[sectionIndex],
        links: [...acc[sectionIndex].links, linkObj],
      },
      ...acc.slice(sectionIndex + 1),
    ];
  }, [] as Section[]);

  return sections;
}
