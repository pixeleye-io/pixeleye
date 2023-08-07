import { Config, parse, transform, renderers } from "@markdoc/markdoc";
import { notFound } from "next/navigation";
import React from "react";
import heading from "../../../schema/heading.markdoc";
import callout from "../../../schema/callout.markdoc";
import link from "../../../schema/link.markdoc";
import { getFile, getAllFiles } from "./utils";

export const dynamicParams = false;

export async function generateStaticParams() {
  const files = await getAllFiles();

  return files.map(({ url }) => ({
    pages: url.split("\\"),
  }));
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

  const file = await getFile(pages).catch((err) => {
    console.log(err);
    return notFound();
  });

  const ast = parse(file);

  const content = transform(ast, config);

  return renderers.react(content, React, { components: {} });
}
