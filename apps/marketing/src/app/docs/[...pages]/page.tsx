import { Config, parse, transform, renderers } from "@markdoc/markdoc";
import { notFound } from "next/navigation";
import React from "react";
import heading from "../../../schema/heading.markdoc";
import callout from "../../../schema/callout.markdoc";
import link from "../../../schema/link.markdoc";
import { getFile, getAllFiles } from "./utils";
import yaml from "js-yaml";
import NextLink from "next/link";
import { cx } from "class-variance-authority";

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
        console.log(child.children[0].children[0].attributes.content);
        headings.push({
          title: child.children[0].children[0].attributes.content,
          id: child.children[0].children[0].attributes.content.replaceAll(
            " ",
            "-"
          ),
          children: [],
        });
      } else if (child.attributes.level === 3) {
        headings[headings.length - 1].children.push({
          title: child.children[0].children[0].attributes.content,
          id: child.children[0].children[0].attributes.content.replaceAll(
            " ",
            "-"
          ),
        });
      }
    }
  }

  return headings;
}

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

  const headings = collectHeadings(ast);

  function isActive(section: any) {
    return false;
  }

  return (
    <>
      <div className="min-w-0 max-w-3xl flex-auto prose dark:prose-invert px-4 py-16 lg:pl-8 lg:pr-0 xl:px-16 h-full">
        {renderers.react(content, React, { components: {} })}
      </div>
      <div className="hidden xl:sticky xl:top-16 xl:-mr-6 xl:block xl:h-[calc(100vh-4.75rem)] xl:flex-none xl:overflow-y-auto xl:py-16 xl:pr-6">
        <nav aria-labelledby="on-this-page-title" className="w-56">
          {headings.length > 0 && (
            <>
              <h2
                id="on-this-page-title"
                className="font-display text-sm font-medium text-slate-900 dark:text-white"
              >
                On this page
              </h2>
              <ol role="list" className="mt-4 space-y-3 text-sm">
                {headings.map((section) => (
                  <li key={section.id}>
                    <h3>
                      <NextLink
                        href={`#${section.id}`}
                        className={cx(
                          isActive(section)
                            ? "text-tertiary"
                            : "font-normal text-on-surface-variant hover:text-on-surface"
                        )}
                      >
                        {section.title}
                      </NextLink>
                    </h3>
                    {section.children.length > 0 && (
                      <ol
                        role="list"
                        className="mt-2 space-y-3 pl-5 text-on-surface-variant"
                      >
                        {section.children.map((subSection: any) => (
                          <li key={subSection.id}>
                            <NextLink
                              href={`#${subSection.id}`}
                              className={
                                isActive(subSection)
                                  ? "text-tertiary"
                                  : "text-on-surface-variant hover:text-on-surface"
                              }
                            >
                              {subSection.title}
                            </NextLink>
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                ))}
              </ol>
            </>
          )}
        </nav>
      </div>
    </>
  );
}
