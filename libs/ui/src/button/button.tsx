import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, cx, type VariantProps } from "class-variance-authority";
import Spinner from "../spinner/spinner";
import { Slottable } from "../types";

const buttonVariants = cva("transition font-semibold flex items-center justify-center", {
  variants: {
    intent: {
      primary: [
        "border",
        "bg-primary text-on-primary border-primary hover:text-primary active:bg-primary/5 hover:bg-transparent",
      ],
      secondary: [
        "border bg-gray-white dark:bg-gray-900",
        "text-gray-600 border-gray-600 hover:text-black hover:border-black active:bg-black/10",
        "dark:text-gray-300 border-gray-500 dark:hover:text-white dark:hover:border-white active:bg-white/10",
      ],
      danger:
        "border text-white bg-red-500 border-red-500 hover:bg-transparent hover:text-red-500 active:bg-red-500/10 ",
      warning:
        "border text-white bg-amber-500 border-amber-500 hover:bg-transparent hover:text-amber-500 active:bg-amber-500/10",
      success:
        "border text-white bg-emerald-500 border-emerald-500 hover:bg-transparent hover:text-emerald-500 active:bg-emerald-500/10 dark:bg-emerald-600 dark:border-emerald-600 dark:hover:bg-transparent dark:hover:text-emerald-600 dark:active:bg-emerald-600/10",
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
    full: {
      true: "w-full",
      false: "",
    },
  },
  defaultVariants: {
    intent: "primary",
    size: "medium",
    shape: "rectangle",
    full: false,
  },
});

export type ButtonVariants = VariantProps<typeof buttonVariants>;

interface Props {
  variant?: ButtonVariants["intent"];
  size?: ButtonVariants["size"];
  full?: ButtonVariants["full"];
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
      full,
      ...rest
    },
    ref
  ) {
    const Component = asChild ? Slot : "button";
    const classes = cx(
      buttonVariants({ intent: variant, size, shape, full }),
      className
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
  }
);

export default Button;
