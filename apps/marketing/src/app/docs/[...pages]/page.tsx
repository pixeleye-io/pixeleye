import { Config, parse, transform, renderers } from "@markdoc/markdoc";
import { notFound } from "next/navigation";
import React from "react";
import heading from "../../../schema/heading.markdoc";
import callout from "../../../schema/callout.markdoc";
import link from "../../../schema/link.markdoc";
import { getFile, getAllFiles } from "./utils";
import yaml from "js-yaml";

export const dynamicParams = false;

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: { pages: string[] };
}) {
  const file = await getFile(params.pages).catch((err) => {
    console.log(err);
    return notFound();
  });

  const ast = parse(file.text);

  const frontmatter = ast.attributes.frontmatter
    ? (yaml.load(ast.attributes.frontmatter) as Record<string, string>)
    : {};

  return {
    title: frontmatter["title"] + " | Pixeleye",
    description: frontmatter["description"],
  };
}

export async function generateStaticParams() {
  const files = await getAllFiles();

  return files.map(({ url }) => ({
    pages: url.split("/"),
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

  const ast = parse(file.text);

  const content = transform(ast, config);

  return renderers.react(content, React, { components: {} });
}
