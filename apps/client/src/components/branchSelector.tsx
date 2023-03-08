"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import * as Popover from "@radix-ui/react-popover";
import { cx } from "class-variance-authority";

export interface BranchSelectorProps {
  selectedBranch: string;
  branches: string[];
  className?: string;
}

export interface BranchSelectorContentProps {
  branches: string[];
  className?: string;
  onBranchSelect?: (branch: string) => void;
}
export function BranchSelectorContent({
  branches,
  className,
  onBranchSelect,
}: BranchSelectorContentProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filteredBranches = useMemo(() => {
    if (deferredQuery === "") {
      return branches;
    }
    return branches.filter((branch) =>
      branch.toLowerCase().includes(deferredQuery.toLowerCase()),
    );
  }, [deferredQuery, branches]);

  return (
    <div className={cx("", className)}>
      <div className="px-2 pt-2">
        <label htmlFor="inputBranchId" className="sr-only">
          Branch name search
        </label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="text"
          name="name"
          id="inputBranchId"
          className="block w-full rounded-md border-0 py-1.5 px-2 bg-gray-50 dark:bg-gray-850 text-gray-900 outline-none dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-600  focus:ring-1 dark:focus:ring-1 focus:ring-inset focus:ring-gray-900 dark:focus:ring-gray-300 sm:text-sm sm:leading-6"
          placeholder="Find a branch"
        />
      </div>
      <ul className="h-48 px-2 mt-3 text-base divide-y divide-gray-200 dark:divide-gray-800">
        {filteredBranches.map((branch) => (
          <li key={branch}>
            <button
              onClick={() => onBranchSelect?.(branch)}
              className="w-full px-2 py-1.5 text-left text-gray-800 rounded hover:bg-gray-50 hover:text-gray-900 dark:hover:text-white dark:hover:bg-gray-850 dark:text-gray-300"
            >
              {branch}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BranchSelector({
  branches,
  selectedBranch,
  className,
}: BranchSelectorProps) {
  return (
    <Popover.Root>
      <Popover.Anchor>
        <Popover.Trigger className={cx("flex items-center", className)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <path d="M160 80a80 80 0 0 1-56 76.3v98.8a122.7 122.7 0 0 1 72-23.1h96a72 72 0 0 0 72-72v-3.7a80 80 0 1 1 48 0v3.7a120 120 0 0 1-120 120h-96a72 72 0 0 0-72 72v3.7a80 80 0 1 1-48 0V156.3A80 80 0 1 1 160 80zm-80 32a32 32 0 1 0 0-64 32 32 0 0 0 0 64zm288-64a32 32 0 1 0 0 64 32 32 0 0 0 0-64zM80 464a32 32 0 1 0 0-64 32 32 0 0 0 0 64z" />
          </svg>
          <span className="mr-2">{selectedBranch}</span>
          <ChevronUpDownIcon className="w-6 h-6" />
        </Popover.Trigger>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content className="z-50">
          <BranchSelectorContent branches={branches} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
