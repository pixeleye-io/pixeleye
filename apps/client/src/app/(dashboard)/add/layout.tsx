import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <hr className="w-full border-t border-neutral-300 dark:border-neutral-700" />
      {children}
    </>
  );
}
