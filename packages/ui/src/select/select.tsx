import { FC, forwardRef } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Label } from "@radix-ui/react-label";
import * as RadixSelect from "@radix-ui/react-select";
import { cx } from "class-variance-authority";

export interface SelectItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const Item = forwardRef<HTMLDivElement, SelectItemProps>(
  ({ value, children, className }, ref) => {
    return (
      <RadixSelect.Item
        ref={ref}
        value={value}
        className={cx(
          "p-2 rounded-md cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800",
          className,
        )}
      >
        <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
        <RadixSelect.ItemIndicator />
      </RadixSelect.Item>
    );
  },
);

export interface SelectProps {
  label: string;
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const Select: FC<SelectProps> = ({
  label,
  children,
  defaultValue,
  value,
  onValueChange,
}) => {
  return (
    <Label>
      {label}
      <RadixSelect.Root
        defaultValue={defaultValue}
        value={value}
        onValueChange={onValueChange}
      >
        <RadixSelect.Trigger className="flex items-center justify-between w-full max-w-xs px-4 py-2 border rounded h-9 dark:border-neutral-700 border-neutral-300">
          <RadixSelect.Value />
          <RadixSelect.Icon>
            <ChevronDownIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            className="w-[var(--radix-select-trigger-width)] z-50 max-h-[var(--radix-select-content-available-height)] overflow-auto bg-neutral-100 rounded-md shadow-lg dark:bg-neutral-900"
            position="popper"
            sideOffset={5}
          >
            <RadixSelect.Viewport>{children}</RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </Label>
  );
};

export default Object.assign(Select, { Item });
