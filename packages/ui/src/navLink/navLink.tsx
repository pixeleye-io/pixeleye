import { Slot } from "@radix-ui/react-slot";
import { cx } from "class-variance-authority";
import { Slottable } from "../types";

interface Props {
  active?: boolean;
}

export type NavLinkProps = Slottable<"a", Props>;

function NavLink({ asChild, className, active, ...rest }: NavLinkProps) {
  const Component = asChild ? Slot : "a";

  return (
    <Component
      className={cx(
        "font-medium",
        active
          ? "text-gray-900 dark:text-white"
          : "text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
        className,
      )}
      {...rest}
    />
  );
}

export default NavLink;
