"use client";

import { createContext, useContext, useId, useState } from "react";
import { cx } from "class-variance-authority";
import { m } from "framer-motion";
import { Slottable } from "../types";


interface TabProps {
  active?: boolean;
}

export type NavTabProps = Slottable<"a", TabProps>;

function NavTab({
  asChild,
  className,
  children,
  active,
  ...rest
}: NavTabProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { layoutId } = useContext(NavTabContext);

  return (
    <m.li
      className={cx("relative z-0 flex items-center justify-center", className)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {isHovered && (
        <m.span
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          layoutId={`${layoutId}-overlay`}
          className="absolute inset-0 rounded -z-10 bg-black/10 dark:bg-white/10"
        />
      )}
      {active && (
        <m.span
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          layoutId={`${layoutId}-border`}
          className="absolute inset-x-0 bottom-0 h-px bg-black rounded-full dark:bg-white"
        />
      )}

      <NavLink
        asChild={asChild as any}
        active={active}
        className="px-4 py-2"
        {...rest}
      >
        {children}
      </NavLink>
    </m.li>
  );
}

interface TabsProps {}

export type NavTabsProps = Slottable<"ol", TabsProps>;

interface NavTabContextType {
  layoutId: string;
}

const NavTabContext = createContext<NavTabContextType>({ layoutId: "" });

function NavTabs({ children, className, ...rest }: NavTabsProps) {
  const layoutId = useId();
  return (
    <NavTabContext.Provider value={{ layoutId }}>
      <ol className={cx("flex items-center", className)} role="list" {...rest}>
        {children}
      </ol>
    </NavTabContext.Provider>
  );
}

export default Object.assign(NavTab, { Tabs: NavTabs });
