"use client";

import { ComponentProps, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, cx, type VariantProps } from "class-variance-authority";

const linkVariants = cva("transition", {
  variants: {
    intent: {
      base: "text-blue-700 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-400",
    },
  },
  defaultVariants: {
    intent: "base",
  },
});

export type LinkVariants = VariantProps<typeof linkVariants>;

interface Props {
  variant?: LinkVariants["intent"];
}

const Link = forwardRef<
  HTMLElement & HTMLAnchorElement,
  ComponentProps<"a"> & Props
>(function Link({ variant, className, children, ...rest }, ref) {
  const classes = cx(linkVariants({ intent: variant }), className);
  return (
    <Slot className={classes} {...rest} ref={ref}>
      {children}
    </Slot>
  );
});

export default Link;
