import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toggle,
} from "@pixeleye/ui";
import { useHotkeys } from "react-hotkeys-hook";
import { CompareTab, DiffGroupedSnapshotTargetGroups, StoreContext } from "./store";
import { FC, useCallback, useContext, useMemo, useRef } from "react";
import { ArrowsPointingInIcon, ChevronDownIcon, EyeIcon } from "@heroicons/react/24/outline";
import { Double, DraggableImageRef, Single } from "./comparisons";
import { ExtendedSnapshotPair } from "./reviewer";
import { ChromiumLogo, EdgeLogo, FirefoxLogo, WebkitLogo } from "@pixeleye/device-logos";
import { m } from "framer-motion";
import { useStore } from "zustand";
import { Snapshot } from "@pixeleye/api";
import { cx } from "class-variance-authority";
import { snapshotStatusText } from "./panels/snapshots";
import { HandThumbDownIcon, HandThumbUpIcon } from "@heroicons/react/24/solid";

const buttonColors: Record<Snapshot["status"], string> = {
  approved: "dark:bg-green-300 dark:text-green-900 bg-green-500 text-green-50",
  rejected: "dark:bg-orange-300 dark:text-orange-900 bg-orange-500 text-orange-50",
  unreviewed: "dark:bg-yellow-300 dark:text-yellow-900 bg-yellow-500 text-yellow-50",
  orphaned: "dark:bg-white dark:text-black bg-black text-white",
  aborted: "dark:bg-red-300 dark:text-red-900 bg-red-500 text-red-50",
  failed: "dark:bg-red-300 dark:text-red-900 bg-red-500 text-red-50",
  missing_baseline: "dark:bg-red-300 dark:text-red-900 bg-red-500 text-red-50",
  processing: "dark:bg-blue-300 dark:text-blue-900 bg-blue-500 text-blue-50",
  unchanged: "dark:bg-teal-300 dark:text-teal-900 bg-teal-500 text-teal-50",
}

const buttonHoverColors: Record<Snapshot["status"], string> = {
  approved: "hover:dark:bg-green-300/90 hover:bg-green-500/90",
  rejected: "hover:dark:bg-orange-300/90 hover:bg-orange-500/90",
  unreviewed: "hover:dark:bg-yellow-300/90 hover:bg-yellow-500/90",
  orphaned: "",
  aborted: "",
  failed: "",
  missing_baseline: "",
  processing: "",
  unchanged: "",
}

function ReviewDropdown({ snapshots, canReview, onReview }: { snapshots: DiffGroupedSnapshotTargetGroups; canReview: boolean; onReview: (status: Snapshot["status"]) => void }) {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={(!["rejected", "unreviewed", "approved"].includes(snapshots.status)) || !canReview} className={cx("rounded px-2 py-1 font-semibold flex divide-outline border border-[currentColor] items-center justify-center", canReview && buttonHoverColors[snapshots.status], buttonColors[snapshots.status])}>
        {snapshotStatusText[snapshots.status]}
        {
          ["rejected", "unreviewed", "approved"].includes(snapshots.status) && canReview && (
            <div className="border-l border-[currentColor] ml-2 pl-2">
              <ChevronDownIcon className="h-4 w-4" />
            </div>)
        }
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent>
          {
            ["rejected", "unreviewed"].includes(snapshots.status) && (<DropdownMenuItem onClick={() => onReview("approved")}>
              <HandThumbUpIcon className="w-4 h-4 mr-2" />
              Approve
              <kbd className="ml-auto text-xs text-on-surface-variant pl-4"><kbd className="font-sans">Ctrl </kbd><kbd className="font-sans">A</kbd></kbd>
            </DropdownMenuItem>)
          }

          {
            ["approved", "unreviewed"].includes(snapshots.status) && (<DropdownMenuItem onClick={() => onReview("rejected")}>
              <HandThumbDownIcon className="w-4 h-4 mr-2" />
              Reject
              <kbd className="ml-auto text-xs text-on-surface-variant"><kbd className="font-sans">Ctrl </kbd><kbd className="font-sans">R</kbd></kbd>
            </DropdownMenuItem>)
          }
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  )

}

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
        <span className="sr-only">Double comparison</span>
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
        <span className="sr-only">Single comparison</span>
      </TabsTrigger>
    </TabsList>
  );
}

interface DisplayOptionsProps {
  resetAlignment: (type?: "single" | "double") => void;
}
function DisplayOptions({ resetAlignment }: DisplayOptionsProps) {
  const store = useContext(StoreContext)!

  const setShowDiff = useStore(store, (state) => state.setShowDiff);
  const showDiff = useStore(store, (state) => state.showDiff);
  const activeTab = useStore(store, (state) => state.activeCompareTab);


  useHotkeys(
    "d",
    (e) => {

      setShowDiff(!showDiff);

      e.preventDefault();
      e.stopPropagation();
    },
    [setShowDiff, showDiff]
  );

  return (
    <div className="flex">
      <Toggle pressed={showDiff} onPressedChange={setShowDiff}>
        <EyeIcon className="w-6 h-6" />
        <span className="sr-only">Toggle diff</span>
      </Toggle>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => resetAlignment(activeTab)}
      >
        <ArrowsPointingInIcon className="w-6 h-6" />
        <span className="sr-only">Reset alignment</span>
      </Button>
    </div>
  );
}

function Title({ snapshot, group }: { snapshot: ExtendedSnapshotPair; group: DiffGroupedSnapshotTargetGroups }) {


  const store = useContext(StoreContext)!
  const setCurrentSnapshot = useStore(store, (state) => state.setCurrentSnapshot);

  return (
    <div className="flex space-x-2 py-1 items-center">
      {
        group.targetGroups.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center text-tertiary p-1 rounded hover:bg-surface-container">
              <span className="sr-only">Select grouped snapshot</span>
              <ChevronDownIcon className="w-5 h-5" />
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent>
                {
                  group.targetGroups.map((targetGroup) => (
                    <DropdownMenuItem key={targetGroup.name} onClick={() => {
                      setCurrentSnapshot(targetGroup.snapshots[0])
                    }}>
                      <span className="text-on-surface">{targetGroup.name}</span>
                      {targetGroup.variant && (
                        <>
                          <span className="px-1 text-on-surface-variant" aria-hidden="true">
                            /
                          </span>
                          <span className="text-on-surface-variant">
                            <span className="sr-only">variant</span>
                            {targetGroup.variant}
                          </span>
                        </>
                      )}
                    </DropdownMenuItem>
                  ))
                }
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        )
      }
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
    </div>
  );
}

const targetIconRepo = {
  "chrome": ChromiumLogo,
  "firefox": FirefoxLogo,
  "safari": WebkitLogo,
  "edge": EdgeLogo
} as const;

export function Compare() {
  const store = useContext(StoreContext)!

  const snapshot = useStore(store, (state) => state.currentSnapshot);
  const build = useStore(store, (state) => state.build);

  const activeTab = useStore(store, (state) => state.activeCompareTab);
  const setActiveTab = useStore(store, (state) => state.setActiveCompareTab);
  const userRole = useStore(store, (state) => state.userRole);

  const buildAPI = useStore(store, (state) => state.buildAPI);
  const setCurrentSnapshot = useStore(store, (state) => state.setCurrentSnapshot);
  const snapshotTargetGroups = useStore(store, (state) => state.snapshots);


  const currentSnapshotIndex = useMemo(() => {
    const index = snapshotTargetGroups.findIndex((group) => group.targetGroups.some((targetGroup) => targetGroup.snapshots.some((snap) => snap.id === snapshot?.id)));
    return index !== -1 ? index : 0;
  }, [snapshot, snapshotTargetGroups]);

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

  const currentSnapshotGroup = snapshotTargetGroups[currentSnapshotIndex];

  const review = (status: Snapshot["status"]) => {
    if (status === "approved") buildAPI.approveSnapshots(currentSnapshotGroup.targetGroups.flatMap((group) => group.snapshots.flatMap((snap) => snap.id)))
    else buildAPI.rejectSnapshots(currentSnapshotGroup.targetGroups.flatMap((group) => group.snapshots.flatMap((snap) => snap.id)))

    setCurrentSnapshot(
      snapshotTargetGroups[currentSnapshotIndex + 1]?.targetGroups[0]?.snapshots[0] ||
      snapshotTargetGroups[currentSnapshotIndex]?.targetGroups[0]?.snapshots[0] ||
      snapshotTargetGroups[0]?.targetGroups[0]?.snapshots[0]
    )
  }

  useHotkeys(
    "a",
    (e) => {

      review("approved");

      e.preventDefault();
      e.stopPropagation();
    },
    [review]
  );

  useHotkeys(
    "r",
    (e) => {

      review("rejected");

      e.preventDefault();
      e.stopPropagation();
    },
    [review]
  );

  if (!snapshot) {
    return null;
  }

  return (
    <main className="w-full z-0 h-full grow-0 flex relative">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab as (value: string) => void}
        defaultValue={"double"}
        className="flex flex-col grow relative"
      >
        <header className="w-full border-b border-outline-variant">
          <div className="flex px-4 py-2 flex-col">
            <div className="flex justify-between items-center">
              <Title snapshot={snapshot} group={currentSnapshotGroup} />

              <div className="space-x-2">
                <ReviewDropdown snapshots={currentSnapshotGroup} canReview={Boolean(build.isLatest) && userRole !== "viewer"} onReview={review} />

              </div>

            </div>

            <div className="flex items-center justify-between flex-wrap">

              <div className="mt-4 flex space-x-4 ">
                <TabSwitcher />
                <DisplayOptions resetAlignment={resetAlignment} />
              </div>
              <TargetTabs snapshot={snapshot} />
            </div>
          </div>
        </header>
        <div className="p-4 w-full grow">
          {snapshot.error && (
            <p className="text-error">{snapshot.error}</p>
          )}
          <TabsContent className="w-full h-full !mt-0 grow-0" value="single">
            <Single draggableImageRef={singleRef} />
            <span className="sr-only">Single comparison</span>
          </TabsContent>
          <TabsContent className="w-full h-full !mt-0 grow-0" value="double">
            <Double draggableImageRef={doubleRef} />
            <span className="sr-only">Double comparison</span>
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

  const store = useContext(StoreContext)!

  const groupedSnapshots = useStore(store, (state) => state.snapshots);

  const targetGroup = groupedSnapshots.find((groups) => groups.targetGroups.some(group => group.name === snapshot.name && group.status === snapshot.status && group.variant === snapshot.variant && group.viewport === snapshot.viewport))?.targetGroups.find(group => group.name === snapshot.name && group.status === snapshot.status && group.variant === snapshot.variant && group.viewport === snapshot.viewport);

  const setCurrentSnapshot = useStore(store, (state) => state.setCurrentSnapshot);

  if (!targetGroup) {
    return null;
  }

  return (
    <ul className="flex justify-center mt-4" role="listbox">
      {
        targetGroup.snapshots.sort((a, b) => (a.target || "").localeCompare(b.target || "")).map((snap) => {

          const TargetLogo = targetIconRepo[snap.targetIcon as keyof typeof targetIconRepo] as FC<{ className?: string }> | undefined;

          const isActive = snap.id === snapshot.id;

          return (
            <li key={snap.id}>

              <Button variant="ghost" role="option" aria-selected={isActive} className={
                isActive ? "text-on-surface" : "text-on-surface-variant"
              } onClick={() => setCurrentSnapshot(snap)} tooltip={snap.target}>
                {
                  TargetLogo ? (<>
                    <TargetLogo className="w-6 h-6" />
                    <span className="sr-only">{snap.target}</span>
                  </>
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
                    } className="border-t border-on-surface w-full absolute" />
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