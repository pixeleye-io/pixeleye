import { cx } from "class-variance-authority";
import { Slottable } from "../types";
import { Slot } from "@radix-ui/react-slot";

interface NavLinkBaseProps {
  active?: boolean;
}

export type NavLinkProps = Slottable<"a", NavLinkBaseProps>;

function NavLink({ asChild, className, active, ...rest }: NavLinkProps) {
  const Component = asChild ? Slot : "a";

  return (
    <Component
      className={cx(
        "font-medium",
        active
          ? "text-on-surface"
          : "text-on-surface-variant hover:text-on-surface",
        className
      )}
      {...rest}
    />
  );
}

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
  return (
    <li
      className={cx(
        "z-0 flex items-center justify-center hover:bg-on-surface/10 rounded my-2",
        className
      )}
    >
      <NavLink
        asChild={asChild as any}
        active={active}
        className="px-4 py-1"
        {...rest}
      >
        {children}
      </NavLink>
    </li>
  );
}

interface TabsProps {}

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
