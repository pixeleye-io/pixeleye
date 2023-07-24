import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, cx, type VariantProps } from "class-variance-authority";
import Spinner from "../spinner/spinner";
import { Slottable } from "../types";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-on-primary hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
      full: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      full: false,
    },
  }
);

export interface Props extends VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  full?: boolean;
}

export type ButtonProps = Slottable<"button", Props>;

const Button = forwardRef<HTMLElement & HTMLButtonElement, ButtonProps>(
  function Button(
    {
      asChild,
      variant,
      size,
      className,
      disabled,
      loading,
      children,
      full,
      ...rest
    },
    ref
  ) {
    const Component = asChild ? Slot : "button";
    const classes = cx(buttonVariants({ variant, size, full }), className);
    return (
      <Component
        disabled={disabled || loading}
        className={classes}
        {...rest}
        ref={ref}
      >
        <div className="relative flex">
          <div className={cx(loading && "opacity-0")}>{children}</div>
          <Spinner
            className="absolute transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
            loading={loading}
          />
        </div>
      </Component>
    );
  }
);

export default Button;
