import { cx } from "class-variance-authority";
import { Slottable } from "../types";
import NavLink from "./navLink";

export interface TabProps {
  active?: boolean;
  layoutId: string;
}

export type NavTabProps = Slottable<"a", TabProps>;

function NavTab({ asChild, className, active, ...rest }: NavTabProps) {
  return (
    <li
      className={cx(
        "z-0 flex items-center justify-center hover:bg-on-surface/10 rounded my-2 relative",
        className
      )}
    >
      <NavLink
        asChild={asChild as any}
        active={active}
        className="px-4 py-1"
        {...rest}
      />
    </li>
  );
}

export interface TabsProps {}

export type NavTabsProps = Slottable<"ol", TabsProps>;

function NavTabs({ children, className, ...rest }: NavTabsProps) {
  return (
    <>
      <ol className={cx("flex items-center", className)} role="list" {...rest}>
        {children}
      </ol>
    </>
  );
}

export default Object.assign(NavTab, { Tabs: NavTabs });
