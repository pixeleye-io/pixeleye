"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@pixeleye/ui";
import { cx } from "class-variance-authority";
import { m } from "framer-motion";

const navigation = [
  { name: "General", href: "" },
  { name: "Connections", href: "/connections" },
  { name: "Billing", href: "/billing" },
  { name: "Notifications", href: "/notifications" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathName = usePathname();

  return (
    <>
      <div className="px-4 py-12 border-b border-neutral-300 dark:border-neutral-700">
        <Container>
          <h1 className="text-4xl">General user settings</h1>
        </Container>
      </div>
      <Container className="flex flex-col pt-8 space-y-8 md:space-x-8 md:space-y-0 md:flex-row">
        <nav
          className="w-full md:max-w-[14rem] space-y-1 grow"
          aria-label="Sidebar"
        >
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={"/settings" + item.href}
              className={cx(
                pathName === "/settings" + item.href
                  ? "text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-200 transition dark:hover:text-neutral-900",
                "flex items-center px-3 py-2 text-base font-medium rounded-md relative rounded",
              )}
              aria-current={
                pathName === "/settings" + item.href ? "page" : undefined
              }
            >
              {pathName === "/settings" + item.href && (
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
    </>
  );
}
