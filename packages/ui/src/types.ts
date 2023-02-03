import React, { ComponentProps, ElementType } from "react";

type Never<T> = { [K in keyof T]: never };

export type Slottable<T extends ElementType, Props> = Props &
  (
    | ({
        asChild?: true;
        children?: React.ReactNode;
      } & Never<Omit<ComponentProps<T>, "ref" | "children" | "key">>)
    | ({
        asChild?: false;
      } & Omit<ComponentProps<T>, "ref">)
  );
