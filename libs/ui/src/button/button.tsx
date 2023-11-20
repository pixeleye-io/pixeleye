import { cloneElement, forwardRef, isValidElement, ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, cx, type VariantProps } from "class-variance-authority";
import Spinner from "../spinner/spinner";
import { Slottable } from "../types";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-on-primary hover:bg-primary/90",
        destructive: "bg-error text-on-error hover:bg-destructive/90",

        outline:
          "border border-outline-variant bg-surface hover:bg-surface-container-low hover:text-primary",
        secondary:
          "bg-surface-container-high text-on-surface hover:bg-surface-container-highest",
        ghost: "hover:bg-surface-container hover:text-on-surface",
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

interface Props extends VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  full?: boolean;
  innerClassName?: string;
  outerClassName?: string;
}

export type ButtonProps = Slottable<"button", Props>;

function Inner({
  loading,
  children,
  innerClassName,
  outerClassName,
}: {
  loading?: boolean;
  children: ReactNode;
  innerClassName?: string;
  outerClassName?: string;
}) {
  return (
    <div className={cx("relative flex", outerClassName)}>
      <div
        className={cx(
          loading && "opacity-0",
          "flex items-center flex-1",
          innerClassName
        )}
      >
        {children}
      </div>
      <Spinner
        className="absolute transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
        loading={loading}
      />
    </div>
  );
}

const Button = forwardRef<HTMLElement & HTMLButtonElement, ButtonProps>(
  function Button(
    {
      asChild,
      variant,
      size,
      className,
      disabled,
      loading,
      outerClassName,
      children,
      innerClassName,
      full,
      ...rest
    },
    ref
  ) {
    const Component = asChild ? Slot : "button";
    const classes = cx(buttonVariants({ variant, size, full }), className);

    const innerChildren =
      isValidElement(children) && asChild ? (
        cloneElement(children, rest, [
          <Inner
            key="inner"
            loading={loading}
            innerClassName={innerClassName}
            outerClassName={outerClassName}
          >
            {(children.props as any).children}
          </Inner>,
        ])
      ) : (
        <Inner
          key="inner"
          loading={loading}
          innerClassName={innerClassName}
          outerClassName={outerClassName}
        >
          {children}
        </Inner>
      );

    return (
      <Component
        disabled={disabled || loading}
        className={classes}
        {...rest}
        ref={ref}
      >
        {innerChildren}
      </Component>
    );
  }
);

export default Button;
