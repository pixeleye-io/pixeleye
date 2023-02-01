import { Slot } from "@radix-ui/react-slot";
import { cx } from "class-variance-authority";
import { Slottable } from "../types";

interface Props {}

export type NavLinkProps = Slottable<"a", Props>;

function NavLink({ asChild, className, ...rest }: NavLinkProps) {
  const Component = asChild ? Slot : "a";

  return (
    <Component
      className={cx(
        "font-medium text-neutral-700 hover:text-black dark:text-neutral-400 dark:hover:text-white",
        className,
      )}
      {...rest}
    />
  );
}

export default NavLink;
