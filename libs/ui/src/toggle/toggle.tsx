"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps, cx } from "class-variance-authority";

export const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-surface transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:text-tertiary",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-outline bg-transparent hover:bg-surface-container hover:text-on-surface",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cx(toggleVariants({ variant, size, className }))}
    {...props}
  />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export default Toggle;
