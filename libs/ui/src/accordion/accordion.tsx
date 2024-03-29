"use client";

import { ElementRef, ComponentPropsWithoutRef, forwardRef } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cx } from "class-variance-authority";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = forwardRef<
  ElementRef<typeof AccordionPrimitive.Item>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(function AccordionItem({ className, ...props }, ref) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cx("border-b border-outline-variant", className)}
      {...props}
    />
  );
});

export interface AccordionTriggerProps
  extends ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {
  size?: "sm" | "md";
}

const AccordionTrigger = forwardRef<
  ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(function AccordionTrigger(
  { className, children, size = "md", ...props },
  ref
) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cx(
          "flex flex-1 items-center justify-between font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
          size === "sm" ? "text-sm  py-2" : "text-base  py-4",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

const AccordionContent = forwardRef<
  ElementRef<typeof AccordionPrimitive.Content>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(function AccordionContent({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={cx(
        "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        className
      )}
      {...props}
    >
      <div className="pb-4 pt-0">{children}</div>
    </AccordionPrimitive.Content>
  );
});

export default Object.assign(Accordion, {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
});
