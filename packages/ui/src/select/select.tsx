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
}

const Select: FC<SelectProps> = ({
  label,
  children,
  className,
  value,
  ...rest
}) => {
  const id = useId();
  return (
    <div className={cx(className, "relative flex flex-col-reverse")}>
      <select
        value={value}
        id={id}
        name="location"
        className="relative block w-full py-2 pl-3 pr-10 mt-1 text-base bg-white border border-gray-300 rounded-md cursor-pointer dark:bg-gray-900 peer dark:border-gray-700 focus:outline-none dark:focus:border-white sm:text-sm"
        {...rest}
      >
        {children}
      </select>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 peer-focus:text-gray-900 dark:text-gray-300 dark:peer-focus:text-white"
      >
        {label}
      </label>
      <ChevronDownIcon className="absolute w-5 h-5 text-white right-2 bottom-2" />
    </div>
  );
};

export default Object.assign(Select, { Item });
