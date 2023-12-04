import {
  Button,
  Header,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toggle,
} from "@pixeleye/ui";
import { CompareTab, useReviewerStore } from "./store";
import { FC, useCallback, useEffect, useRef } from "react";
import { ArrowsPointingInIcon, EyeIcon } from "@heroicons/react/24/outline";
import { Double, DraggableImageRef, Single } from "./comparisons";
import { ExtendedSnapshotPair } from "./reviewer";
import { ChromiumLogo, FirefoxLogo, WebkitLogo } from "./logos";
import Link from "next/link";
import { m } from "framer-motion";

function TabSwitcher() {
  return (
    <TabsList>
      <TabsTrigger value="double">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          className="w-5 h-5"
          viewBox="0 0 48 48"
        >
          <path
            stroke="currentColor"
            strokeWidth="4"
            d="M41 4H7a3 3 0 0 0-3 3v34a3 3 0 0 0 3 3h34a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Z"
          />
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="4"
            d="M24 4v40"
          />
        </svg>
      </TabsTrigger>
      <TabsTrigger value="single">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          className="w-5 h-5"
          viewBox="0 0 48 48"
        >
          <path
            stroke="currentColor"
            strokeWidth="4"
            d="M41 4H7a3 3 0 0 0-3 3v34a3 3 0 0 0 3 3h34a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Z"
          />
        </svg>
      </TabsTrigger>
    </TabsList>
  );
}

interface DisplayOptionsProps {
  resetAlignment: (type?: "single" | "double") => void;
}
function DisplayOptions({ resetAlignment }: DisplayOptionsProps) {
  const setShowDiff = useReviewerStore((state) => state.setShowDiff);
  const showDiff = useReviewerStore((state) => state.showDiff);
  const activeTab = useReviewerStore((state) => state.activeCompareTab);

  return (
    <div className="flex">
      <Toggle pressed={showDiff} onPressedChange={setShowDiff}>
        <EyeIcon className="w-6 h-6" />
      </Toggle>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => resetAlignment(activeTab)}
      >
        <ArrowsPointingInIcon className="w-6 h-6" />
      </Button>
    </div>
  );
}

function Title({ snapshot }: { snapshot: ExtendedSnapshotPair }) {
  return (
    <h2 className="first-letter:uppercase text-on-surface text-xl cursor-text font-bold">
      {snapshot.name}

      {snapshot.variant && (
        <>
          <span className="px-1 text-on-surface-variant" aria-hidden="true">
            /
          </span>
          <span className="text-on-surface-variant">
            <span className="sr-only">variant</span>
            {snapshot.variant}
          </span>
        </>
      )}
      {snapshot.viewport && (
        <>
          <span className="text-on-surface-variant mx-1" aria-hidden="true">
            ·
          </span>
          <span className="text-on-surface-variant text-sm font-normal">
            <span className="sr-only">viewport</span>
            {snapshot.viewport}
          </span>
        </>
      )}
    </h2>
  );
}

const targetIconRepo = {
  "chromium": ChromiumLogo,
  "firefox": FirefoxLogo,
  "webkit": WebkitLogo
} as const;

export function Compare() {
  const snapshot = useReviewerStore((state) => state.currentSnapshot);
  const build = useReviewerStore((state) => state.build);

  const activeTab = useReviewerStore((state) => state.activeCompareTab);
  const setActiveTab = useReviewerStore((state) => state.setActiveCompareTab);
  const userRole = useReviewerStore((state) => state.userRole);

  const buildAPI = useReviewerStore((state) => state.buildAPI);

  const singleRef = useRef<DraggableImageRef>(null);
  const doubleRef = useRef<DraggableImageRef>(null);

  const resetAlignment = useCallback((type?: CompareTab) => {
    if (!type || type === "single") {
      singleRef.current?.center();
    }
    if (!type || type === "double") {
      doubleRef.current?.center();
    }
  }, []);

  useEffect(() => {
    resetAlignment();
  }, [resetAlignment, snapshot]);

  if (!snapshot) {
    return null;
  }

  const validSnapshot = Boolean(
    snapshot.snapURL && snapshot.snapWidth && snapshot.snapHeight
  );

  const validBaseline = Boolean(
    snapshot.baselineURL && snapshot.baselineWidth && snapshot.baselineHeight
  );

  const validCompare = validSnapshot && validBaseline;






  return (
    <main className="w-full ml-1 z-0 h-full grow-0 flex relative">
      <Tabs
        value={validCompare ? activeTab : "single"}
        onValueChange={setActiveTab as (value: string) => void}
        defaultValue={validCompare ? "double" : "single"}
        className=" w-full h-full grow-0 relative max-h-full"
      >
        <header className="w-full border-b border-outline-variant">
          <div className="flex px-4 py-2 flex-col">
            <div className="flex justify-between items-center">
              <Title snapshot={snapshot} />

              {userRole !== "viewer" &&
                ["unreviewed", "approved", "rejected"].includes(
                  snapshot.status
                ) &&
                build.isLatest && (
                  <div>
                    <Button
                      variant="ghost"
                      className="text-error"
                      onClick={() => buildAPI.rejectSnapshot(snapshot.id)}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-green-500 dark:text-green-300 dark:hover:text-on-surface"
                      onClick={() => buildAPI.approveSnapshot(snapshot.id)}
                    >
                      Approve
                    </Button>
                  </div>
                )}

            </div>

            <div className="flex items-center justify-between">

              <div className="mt-4 flex space-x-4">
                <TabSwitcher />
                <DisplayOptions resetAlignment={resetAlignment} />
              </div>
              <TargetTabs snapshot={snapshot} />
            </div>
          </div>
        </header>
        <div className="p-4 w-full h-[calc(100%-6.25rem-1px)]">
          {snapshot.error && (
            <p className="text-error">{snapshot.error}</p>
          )}
          <TabsContent className="w-full h-full !mt-0 grow-0" value="single">
            <Single draggableImageRef={singleRef} />
          </TabsContent>
          <TabsContent className="w-full h-full !mt-0 grow-0" value="double">
            <Double draggableImageRef={doubleRef} />
          </TabsContent>
        </div>
      </Tabs>
    </main>
  );
}


function TargetTabs({
  snapshot
}: {
  snapshot: ExtendedSnapshotPair
}) {

  const groupedSnapshots = useReviewerStore((state) => state.snapshots);

  const targetGroup = groupedSnapshots.find((group) => group.name === snapshot.name && group.status === snapshot.status && group.variant === snapshot.variant && group.viewport === snapshot.viewport);

  const setCurrentSnapshot = useReviewerStore((state) => state.setCurrentSnapshot);

  if (!targetGroup) {
    return null;
  }

  return (
    <ul className="flex items-center">
      {
        targetGroup.snapshots.sort((a, b) => (a.target || "").localeCompare(b.target || "")).map((snap) => {

          const TargetLogo = targetIconRepo[snap.target as keyof typeof targetIconRepo] as FC<{ className?: string }> | undefined;

          const isActive = snap.id === snapshot.id;

          return (
            <li key={snap.id}>
              <Button variant="ghost" aria-selected={isActive} className={
                isActive ? "text-primary" : "text-on-surface-variant"
              } onClick={() => setCurrentSnapshot(snap)}>
                {
                  TargetLogo ? (
                    <TargetLogo className="w-6 h-6" />
                  ) : (
                    <span className="capitalize text-xs">{snap.target}</span>
                  )
                }
              </Button>
              <div className="relative mx-auto w-6">

                {
                  isActive && (
                    <m.hr layoutId={
                      "target-switcher-" + targetGroup.name + "-" + targetGroup.status + "-" + targetGroup.variant + "-" + targetGroup.viewport
                    } className="border-t border-primary w-full absolute" />
                  )
                }
              </div>

            </li>
          )
        })
      }
    </ul>
  )
} 