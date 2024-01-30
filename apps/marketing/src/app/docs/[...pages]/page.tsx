import { parse, transform, renderers } from "@markdoc/markdoc";
import { notFound } from "next/navigation";
import React from "react";
import heading from "../../../schema/heading.markdoc";
import callout from "../../../schema/callout.markdoc";
import fence from "../../../schema/fence.markdoc";
import code from "../../../schema/code.markdoc";
import { Feedback } from "./feedback";
import link from "../../../schema/link.markdoc";
import { getFile, getAllFiles, getCommitDate } from "./utils";
import yaml from "js-yaml";
import NextLink from "next/link";
import { cx } from "class-variance-authority";
import { Link } from "@pixeleye/ui";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { PageNavigation } from "./nextPage";
import { HeadingNav } from "./heading-nav";

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

const config: any = {
  tags: {
    callout,
  },
  nodes: {
    heading,
    link,
    fence,
    code,
  },
  variables: {},
};

function collectHeadings(node: any) {
  const headings: {
    title: string;
    id: string;
    children: {
      title: string;
      id: string;
    }[];
  }[] = [];
  if (node) {
    for (const child of node.children) {
      if (child.type !== "heading") continue;
      if (child.attributes.level === 2) {
        headings.push({
          title: child.children[0].children[0].attributes.content,
          id: child.children[0].children[0].attributes.content
            .replaceAll(" ", "-")
            .toLowerCase(),
          children: [],
        });
      } else if (child.attributes.level === 3) {
        headings[headings.length - 1].children.push({
          title: child.children[0].children[0].attributes.content,
          id: child.children[0].children[0].attributes.content
            .replaceAll(" ", "-")
            .toLowerCase(),
        });
      }
    }
  }

  return headings;
}



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

  const lastModified = await getCommitDate(file.path)

  const ast = parse(file.text);

  const content = transform(ast, config);

  const headings = collectHeadings(ast);



  return (
    <>
      <div className="min-w-0 max-w-4xl flex-auto prose px-4 py-16 lg:pl-8 lg:pr-0 xl:px-12 h-full">
        {renderers.react(content, React, { components: {} })}
        <div className="flex justify-between items-center flex-col lg:flex-row mt-24 space-y-6">
          <Feedback page={file.url} />
          {lastModified && (
            <p className="text-sm text-on-surface-variant not-prose text-right sm:whitespace-nowrap">
              Last modified: {lastModified.toLocaleDateString()}
            </p>
          )}
        </div>
        <hr className="border-outline-variant mt-4 mb-4" />
        <PageNavigation currentPageURL={"/docs/" + pages.join("/")} />

      </div>
      <div className="hidden xl:sticky xl:top-[4.5rem] xl:-mr-6 xl:block xl:h-[calc(100vh-4.5rem)] xl:flex-none xl:overflow-y-auto xl:py-16 xl:pr-6">
        <HeadingNav headings={headings} githubURL={file.githubURL} />
      </div>
    </>
  );
}
