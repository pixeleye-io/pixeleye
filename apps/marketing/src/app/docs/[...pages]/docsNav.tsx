"use client";

import NextLink from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export interface Section {
  title: string;
  links: {
    title: string;
    href: string;
  }[];
}

interface DocsNavProps {
  sections: Section[];
}

export function DocsNavDesktop({ sections }: DocsNavProps) {
  const pathname = usePathname();
  return (
    <nav className="text-base md:text-sm">
      <ul role="list" className="space-y-9">
        {sections.map((section) => (
          <li key={section.title}>
            <h2 className="font-display capitalize font-medium text-on-surface">
              {section.title}
            </h2>
            <ul
              role="list"
              className="mt-2 space-y-2 border-l-2 md:mt-4 md:space-y-4 border-outline-variant"
            >
              {section.links.map((link) => (
                <li key={link.href} className="relative">
                  <NextLink
                    href={link.href}
                    className={clsx(
                      "block w-full capitalize pl-3.5 before:pointer-events-none before:absolute before:-left-1 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full",
                      link.href === pathname
                        ? "before:bg-tertiary font-semibold text-tertiary"
                        : "before:hidden before:bg-on-surface-variant hover:text-on-surface hover:before:block text-on-surface-variant"
                    )}
                  >
                    {link.title}
                  </NextLink>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function DocsNavMobile({ sections }: DocsNavProps) {
  return (
    <Collapsible.Root className="bg-surface/90 backdrop-blur-sm fixed w-full inset-x-0 top-16 data-[state=open]:bottom-0">
      <Collapsible.Trigger className="flex group py-3.5 border-b data-[state=open]:border-none border-outline-variant px-6 items-center text-on-surface text-sm w-full">
        <ChevronDownIcon className="h-4 w-4 group-data-[state=open]:rotate-180 mr-2" /> Menu
      </Collapsible.Trigger>
      <Collapsible.Content className="fixed lg:hidden w-full overflow-y-auto px-6 py-4 ">
        <DocsNavDesktop sections={sections} />
      </Collapsible.Content>
    </Collapsible.Root>
  );
}