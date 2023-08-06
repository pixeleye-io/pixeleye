import { Config, parse, transform, renderers } from "@markdoc/markdoc";
import { notFound } from "next/navigation";
import React from "react";
import { readdir } from "fs/promises";
import { resolve } from "path";

import heading from "../../../schema/heading.markdoc";
import callout from "../../../schema/callout.markdoc";
import link from "../../../schema/link.markdoc";

export const dynamicParams = false;

function getFile(pages: string[]) {
  const path = pages.map((p) => decodeURI(p)).join("/")

  console.log(path);

  return import(`../../../../../../docs/${path}.md`).then((res) => res.default);
}

async function* getFiles(dir: string): AsyncGenerator<string> {
  // const files = await readdir("posts");
  // console.log(files);
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

export async function generateStaticParams() {
  const files = [];

  for await (const f of getFiles("../../docs")) {
    files.push(f);
  }

  return files.map((f) => {
    const file = decodeURI(f);

    return {
      pages: file
        .replaceAll("%2F", "\\")
        .replace(/(.*)(\\docs\\)/, "")
        .replace(".md", "")
        .split("\\"),
    };
  });
}

const config: Config = {
  tags: {
    callout,
  },
  nodes: {
    heading,
    link,
  },
  variables: {},
};

// @ts-ignore
export default async function Page({
  params,
}: {
  params: { pages: string[] };
}) {
  const { pages } = params;

  console.log(pages);

  const file = await getFile(pages).catch(() => {
    return notFound();
  });

  const ast = parse(file);

  const content = transform(ast, config);

  return renderers.react(content, React, { components: {} });
}
