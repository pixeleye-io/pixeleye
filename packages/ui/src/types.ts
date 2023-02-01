import { ComponentProps, ElementType } from "react";

type Never<T> = { [K in keyof T]: never };

export type Slottable<T extends ElementType, Props> = Props &
  (
    | ({
        asChild: true;
      } & Never<Omit<ComponentProps<T>, "ref">>)
    | ({
        asChild?: false;
      } & Omit<ComponentProps<T>, "ref">)
  );
