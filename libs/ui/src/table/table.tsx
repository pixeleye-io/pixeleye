import { cx } from "class-variance-authority";
import {
  HTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
  forwardRef,
} from "react";

const TableRoot = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  function Table({ className, ...props }, ref) {
    return (
      <div className="w-full overflow-auto">
        <table
          ref={ref}
          className={cx("w-full caption-bottom text-sm ", className)}
          {...props}
        />
      </div>
    );
  }
);

const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(function TableHeader({ className, ...props }, ref) {
  return (
    <thead
      ref={ref}
      className={cx("[&_tr]:border-b border-outline-variant", className)}
      {...props}
    />
  );
});

const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(function TableBody({ className, ...props }, ref) {
  return (
    <tbody
      ref={ref}
      className={cx("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
});

const TableFooter = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(function TableFooter({ className, ...props }, ref) {
  return (
    <tfoot
      ref={ref}
      className={cx("bg-primary font-medium text-on-primary", className)}
      {...props}
    />
  );
});

const TableRow = forwardRef<
  HTMLTableRowElement,
  HTMLAttributes<HTMLTableRowElement>
>(function TableRow({ className, ...props }, ref) {
  return (
    <tr
      ref={ref}
      className={cx(
        "border-b border-outline-variant transition-colors hover:bg-surface-container/50 data-[state=selected]:bg-surface-container",
        className
      )}
      {...props}
    />
  );
});

const TableHead = forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement>
>(function TableHead({ className, ...props }, ref) {
  return (
    <th
      ref={ref}
      className={cx(
        "h-12 px-4 text-left align-middle font-medium text-on-surface-variant ",
        className
      )}
      {...props}
    />
  );
});

const TableCell = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(function TableCell({ className, ...props }, ref) {
  return (
    <td
      ref={ref}
      className={cx(
        "p-4 align-middle ",
        className
      )}
      {...props}
    />
  );
});

const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  HTMLAttributes<HTMLTableCaptionElement>
>(function TableCaption({ className, ...props }, ref) {
  return (
    <caption
      ref={ref}
      className={cx("mt-4 text-sm text-on-surface-variant", className)}
      {...props}
    />
  );
});

export default Object.assign(TableRoot, {
  Header: TableHeader,
  Body: TableBody,
  Footer: TableFooter,
  Row: TableRow,
  Head: TableHead,
  Cell: TableCell,
  Caption: TableCaption,
});
