import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, cx, type VariantProps } from "class-variance-authority";
import { Slottable } from "../types";

const linkVariants = cva("transition", {
  variants: {
    intent: {
      base: "text-blue-700 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-400",
    },
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    }
  },
  defaultVariants: {
    intent: "base",
    size: "md",
  },
});

export type LinkVariants = VariantProps<typeof linkVariants>;

interface Props {
  variant?: LinkVariants["intent"];
  size?: LinkVariants["size"];
}

export type LinkProps = Slottable<"a", Props>;

const Link = forwardRef<HTMLElement & HTMLAnchorElement, LinkProps>(
  function Link({ variant, className, children, asChild, ...rest }, ref) {
    const classes = cx(linkVariants({ intent: variant }), className);
    const Component = asChild ? Slot : "a";
    return (
      <Component className={classes} {...rest} ref={ref}>
        {children}
      </Component>
    );
  }
);

export default Link;
