"use client";

import {
  DetailedHTMLProps,
  FC,
  HTMLAttributes,
  forwardRef,
  useId,
} from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { cx } from "class-variance-authority";

export interface SelectItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const Item = forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ value, children, className }, ref) => {
    return (
      <option
        ref={ref}
        value={value}
        className={cx("p-2 rounded-md cursor-pointer", className)}
      >
        {children}
      </option>
    );
  },
);

export interface SelectProps
  extends DetailedHTMLProps<
    HTMLAttributes<HTMLSelectElement>,
    HTMLSelectElement
  > {
  label: string;
  children: React.ReactNode;
  value?: string;
  hiddenLabel?: boolean;
}

const Select: FC<SelectProps> = ({
  label,
  children,
  className,
  hiddenLabel,
  value,
  ...rest
}) => {
  const id = useId();
  return (
    <div
      className={cx(
        className,
        "relative flex focus-within:dark:border-white hover:border-gray-700 transition hover:dark:border-gray-300 group focus-within:border-gray-900 dark:border-gray-700 border border-gray-300 bg-gray-50 rounded-md dark:bg-gray-850 ",
      )}
    >
      <label
        htmlFor={id}
        className={cx(
          "px-2 my-auto text-sm font-medium text-gray-700 transition dark:text-gray-300 group-focus-within:text-gray-900 dark:group-focus-within:text-white",
          // @ts-ignore
          hiddenLabel && "sr-only",
        )}
      >
        {label}
      </label>
      <select
        value={value}
        id={id}
        name="location"
        className={cx(
          "relative block w-full py-2 pl-3 pr-10 text-base text-gray-800 transition bg-white cursor-pointer dark:bg-gray-900  dark:text-gray-300 focus:text-gray-900 focus:dark:text-white  focus:outline-none sm:text-sm",
          hiddenLabel
            ? "rounded-md"
            : "border-l dark:border-gray-700 border-gray-300 rounded-r-md",
        )}
        {...rest}
      >
        {children}
      </select>

      <ChevronDownIcon className="absolute w-5 h-5 text-gray-700 transition pointer-events-none dark:text-gray-300 right-2 bottom-2 group-focus-within:text-gray-900 dark:group-focus-within:text-white" />
    </div>
  );
};

export default Object.assign(Select, { Item });
