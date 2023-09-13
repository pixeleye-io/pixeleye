import { Slot } from "@radix-ui/react-slot";
import { cx } from "class-variance-authority";
import { Slottable } from "../types";

interface Props {}

export type ContainerProps = Slottable<"div", Props>;

function Container({ asChild, className, ...props }: ContainerProps) {
  const Container = asChild ? Slot : "div";
  return (
    <Container className={cx("mx-auto px-4", className)} {...props} />
  );
}

export default Container;
