import { ComponentProps, ElementType } from "react";

export type Slottable<T extends ElementType, Props, TAsChild = false> =  Props & ComponentProps<T> & {
    asChild?: TAsChild;
}