"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cx } from "class-variance-authority";
import {
  forwardRef,
  ElementRef,
  ComponentPropsWithoutRef,
  createContext,
  useId,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
} from "react";
import { m } from "framer-motion";

const TabsContext = createContext<{
  layoutId?: string;
  selected?: string;
}>({});

const Tabs = forwardRef<
  ElementRef<typeof TabsPrimitive.Root>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & {
    storageKey?: string;
  }
>(function Tabs({ defaultValue, storageKey, onValueChange, value, ...props }, ref) {
  const defaultVal =
    storageKey && typeof window !== "undefined"
      ? localStorage.getItem(storageKey)
      : defaultValue;

  const [selected, setSelected] = useState(value ?? defaultVal ?? defaultValue);

  useEffect(() => {
    if (value) {
      setSelected(value);
    }
  }
    , [value]);

  const onChange = (val: string) => {
    setSelected(val);
    if (storageKey) {
      localStorage.setItem(storageKey, val);
    }
    onValueChange?.(val);
  };

  const layoutId = useId();

  return (
    <TabsContext.Provider
      value={{
        layoutId,
        selected,
      }}
    >
      <TabsPrimitive.Root
        onValueChange={onChange}
        value={selected}
        ref={ref}
        {...props}
      />
    </TabsContext.Provider>
  );
});

const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cx(
      "inline-flex h-10 items-center justify-center rounded-md bg-surface-container-highest dark:bg-surface-container p-1 text-on-surface-variant",
      className
    )}
    asChild
    {...props}
  >
    <m.div layoutRoot layout>
      {children}
    </m.div>
  </TabsPrimitive.List>
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  const { layoutId, selected } = useContext(TabsContext);
  return (
    <div className="relative z-0">
      <TabsPrimitive.Trigger
        ref={ref}
        className={cx(
          "inline-flex items-center z-10 justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-surface transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-on-surface",
          className
        )}
        {...props}
      />
      {selected === props.value && (
        <m.span
          layoutId={layoutId}
          className="bg-surface-container-lowest shadow-sm absolute -z-10 inset-0 rounded-sm"
        />
      )}
    </div>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cx(
      "mt-2 ring-offset-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
