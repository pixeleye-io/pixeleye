import { FC } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cx } from "class-variance-authority";
import { Slottable } from "../types";

export interface BreadcrumbsProps {
  children: React.ReactNode;
  className?: string;
}

const Breadcrumbs: FC<BreadcrumbsProps> = ({ className, children }) => {
  return (
    <ol role="list" className={cx("flex items-center space-x-3", className)}>
      {children}
    </ol>
  );
};

export interface ItemBaseProps {
  hideLeadingSlash?: boolean;
}

export type ItemProps = Slottable<"a", ItemBaseProps>;

const Item: FC<ItemProps> = ({
  hideLeadingSlash,
  asChild,
  className,
  ...rest
}) => {
  const Component = asChild ? Slot : "a";
  return (
    <li className={cx("flex items-center", className)}>
      {!hideLeadingSlash && (
        <svg
          className="flex-shrink-0 w-6 h-6 text-neutral-500 dark:text-neutral-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
        </svg>
      )}
      <Component
        className="ml-2 text-base font-medium text-neutral-800 hover:text-black dark:text-neutral-300 dark:hover:text-white"
        {...rest}
      />
    </li>
  );
};

export default Object.assign(Breadcrumbs, { Item });