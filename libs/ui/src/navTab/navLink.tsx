"use client";
import { Slot } from "@radix-ui/react-slot";
import { Slottable } from "../types";
import { cx } from "class-variance-authority";
import { m } from "framer-motion";

export interface NavLinkBaseProps {
  layoutId: string;
  active?: boolean;
}

export type NavLinkProps = Slottable<"a", NavLinkBaseProps>;

export default function NavLink({
  asChild,
  className,
  children,
  href,
  layoutId,
  active,
  ...rest
}: NavLinkProps) {
  const Component = asChild ? Slot : "a";

  return (
    <>
      <Component
        className={cx(
          "font-medium",
          active
            ? "text-on-surface"
            : "text-on-surface-variant hover:text-on-surface",
          className
        )}
        {...rest}
      >
        {children}
      </Component>
      {active && (
        <m.span
          layoutId={layoutId}
          className="absolute inset-x-6 -bottom-[calc(0.5rem_+_1px)] h-px bg-primary"
        />
      )}
    </>
  );
}
