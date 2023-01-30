import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, cx, type VariantProps } from "class-variance-authority";
import { Slottable } from "../types";

const buttonVariants = cva("font-normal transition", {
  variants: {
    intent: {
      primary: [
        "border",
        "bg-black text-white border-black hover:text-black active:bg-black/10 hover:bg-transparent",
        "dark:bg-white border dark:text-black dark:border-white dark:hover:bg-transparent hover:bg-transparent dark:hover:text-white dark:active:bg-white/10",
      ],
      secondary: [
        "border bg-transparent",
        "text-neutral-600 border-neutral-600 hover:text-black hover:border-black active:bg-black/10",
        "dark:text-neutral-500 border-neutral-500 dark:hover:text-white dark:hover:border-white active:bg-white/10",
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
}

export type ButtonProps = Slottable<"button", Props, true>;

const Button = forwardRef<HTMLElement & HTMLButtonElement, ButtonProps>(
  function Button({ asChild, className, variant, size, ...rest }, ref) {
    const Component = asChild ? Slot : "button";
    const classes = cx(buttonVariants({ intent: variant, size }), className);
    return <Component className={classes} {...rest} ref={ref} />;
  },
);

export default Button;
