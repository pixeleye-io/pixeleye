"use client";

import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, cx, type VariantProps } from "class-variance-authority";
import Spinner from "../spinner/spinner";
import { Slottable } from "../types";

const buttonVariants = cva("transition font-semibold", {
  variants: {
    intent: {
      primary: [
        "border",
        "bg-black text-white border-black hover:text-black active:bg-black/10 hover:bg-transparent",
        "dark:bg-white border dark:text-black dark:border-white dark:hover:bg-transparent hover:bg-transparent dark:hover:text-white dark:active:bg-white/10",
      ],
      secondary: [
        "border bg-gray-white dark:bg-gray-900",
        "text-gray-600 border-gray-600 hover:text-black hover:border-black active:bg-black/10",
        "dark:text-gray-300 border-gray-500 dark:hover:text-white dark:hover:border-white active:bg-white/10",
      ],
      danger:
        "border text-white bg-red-500 border-red-500 hover:bg-transparent hover:text-red-500 active:bg-red-500/10",
      warning:
        "border text-white bg-amber-500 border-amber-500 hover:bg-transparent hover:text-amber-500 active:bg-amber-500/10",
      success:
        "border text-white bg-green-500 border-green-500 hover:bg-transparent hover:text-green-500 active:bg-green-500/10",
    },
    shape: {
      rectangle: "rounded-lg active:rounded-xl",
      square: "rounded-lg aspect-square",
      circle: "rounded-full",
    },
    size: {
      small: ["text-sm", "py-1", "px-2"],
      medium: ["text-base", "py-2", "px-4"],
    },
  },
  defaultVariants: {
    intent: "primary",
    size: "medium",
    shape: "rectangle",
  },
});

export type ButtonVariants = VariantProps<typeof buttonVariants>;

interface Props {
  variant?: ButtonVariants["intent"];
  size?: ButtonVariants["size"];
  shape?: ButtonVariants["shape"];
  loading?: boolean;
}

export type ButtonProps = Slottable<"button", Props>;

const Button = forwardRef<HTMLElement & HTMLButtonElement, ButtonProps>(
  function Button(
    {
      asChild,
      variant,
      size,
      shape,
      className,
      disabled,
      loading,
      children,
      ...rest
    },
    ref,
  ) {
    const Component = asChild ? Slot : "button";
    const classes = cx(
      buttonVariants({ intent: variant, size, shape }),
      className,
    );
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
  },
);

export default Button;
