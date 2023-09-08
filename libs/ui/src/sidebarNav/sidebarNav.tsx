"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "../button";
import { m } from "framer-motion";
import { cx } from "class-variance-authority";
import { useId } from "react";

export interface SidebarNavLink {
  href: string;
  title: string;
}

export interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: SidebarNavLink[];
}

export default function SidebarNav({
  className,
  items,
  ...props
}: SidebarNavProps) {
  const pathname = usePathname();

  const layoutId = useId();

  return (
    <nav
      className={cx(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cx(
            buttonVariants({ variant: "ghost" }),
            pathname !== item.href.split("?")[0] && "hover:underline",
            "justify-start relative z-0  hover:!bg-transparent"
          )}
        >
          {item.title}
          {pathname === item.href.split("?")[0] && (
            <m.span
              className="bg-surface-container absolute inset-0 rounded-md -z-10"
              layoutId={layoutId}
            />
          )}
        </Link>
      ))}
    </nav>
  );
}
