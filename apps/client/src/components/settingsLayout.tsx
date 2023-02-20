"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@pixeleye/ui";
import { cx } from "class-variance-authority";
import { m } from "framer-motion";

interface SettingsLayoutProps {
  navigation: {
    name: string;
    href: string;
  }[];
  children: React.ReactNode;
}

export default function SettingsLayout({
  navigation,
  children,
}: SettingsLayoutProps) {
  const pathName = usePathname();
  return (
    <Container className="flex flex-col pt-8 space-y-8 md:space-x-8 md:space-y-0 md:flex-row">
      <nav
        className="w-full md:max-w-[14rem] space-y-1 grow"
        aria-label="Sidebar"
      >
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cx(
              pathName === item.href
                ? "text-neutral-900 dark:text-neutral-100"
                : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-200 transition dark:hover:text-neutral-900",
              "flex items-center px-3 py-2 text-base font-medium rounded-md relative rounded",
            )}
            aria-current={pathName === item.href ? "page" : undefined}
          >
            {pathName === (item.href === "/" ? "" : item.href) && (
              <m.span
                layoutId="settingsNav"
                className="absolute inset-0 rounded bg-black/10 dark:bg-white/10"
              />
            )}
            <span className="truncate">{item.name}</span>
          </Link>
        ))}
      </nav>
      <div className="grow">{children}</div>
    </Container>
  );
}
