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
import { CompareTab, SnapshotTargetGroup, StoreContext, store } from "./store";
import { FC, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { ArrowsPointingInIcon, ChevronDownIcon, EyeIcon } from "@heroicons/react/24/outline";
import { Double, DraggableImageRef, Single } from "./comparisons";
import { ExtendedSnapshotPair } from "./reviewer";
import { ChromiumLogo, EdgeLogo, FirefoxLogo, WebkitLogo } from "@pixeleye/device-logos";
import { m } from "framer-motion";
import { useStore } from "zustand";
import { Snapshot } from "@pixeleye/api";
import { cx } from "class-variance-authority";
import { snapshotStatusText } from "./panels/snapshots";

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
  orphaned: "hover:dark:bg-white/90 hover:bg-black/20",
  aborted: "hover:dark:bg-red-300/90 hover:bg-red-500/90",
  failed: "hover:dark:bg-red-300/90 hover:bg-red-500/90",
  missing_baseline: "hover:dark:bg-red-300/90 hover:bg-red-500/90",
  processing: "hover:dark:bg-blue-300/90 hover:bg-blue-500/90",
  unchanged: "hover:dark:bg-teal-300/90 hover:bg-teal-500/90",
}


function ReviewDropdown({ snapshots, canReview, onReview }: { snapshots: SnapshotTargetGroup; canReview: boolean; onReview: (status: Snapshot["status"]) => void }) {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={(!["rejected", "unreviewed", "approved"].includes(snapshots.status)) && !canReview} className={cx("rounded px-2 py-1 font-semibold flex divide-outline border border-[currentColor] items-center justify-center", canReview && buttonHoverColors[snapshots.status], buttonColors[snapshots.status])}>
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
              Approve
            </DropdownMenuItem>)
          }

          {
            ["approved", "unreviewed"].includes(snapshots.status) && (<DropdownMenuItem onClick={() => onReview("rejected")}>
              Reject
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

const snapStatusColors: Record<Snapshot["status"], string> = {
  "approved": "bg-green-500/25 border-green-700 dark:text-green-200 text-green-700",
  "rejected": "bg-orange-500/25 border-orange-700 dark:text-orange-200 text-orange-700",
  "unreviewed": "bg-yellow-500/25 border-yellow-700 dark:text-yellow-200 text-yellow-700",
  "orphaned": "dark:bg-white/25 dark:border-white dark:text-white text-black/75 border-black dark:border-black",
  aborted: "bg-red-500/25 border-red-700 dark:text-red-200 text-red-700",
  failed: "bg-red-500/25 border-red-700 dark:text-red-200 text-red-700",
  missing_baseline: "bg-red-500/25 border-red-700 dark:text-red-200 text-red-700",
  processing: "bg-blue-500/25 border-blue-700 dark:text-blue-200 text-blue-700",
  unchanged: "bg-teal-500/25 border-teal-700 dark:text-teal-200 light:text-teal-700",
}

function SnapStatus({ status }: {
  status: Snapshot["status"]
}) {

  return (
    <div className="flex items-center justify-center mt-4">
      <p className={cx("border text-sm p-1 rounded block", snapStatusColors[status])}>
        {snapshotStatusText[status]}
      </p>
    </div>
  )
}

interface DisplayOptionsProps {
  resetAlignment: (type?: "single" | "double") => void;
}
function DisplayOptions({ resetAlignment }: DisplayOptionsProps) {
  const store = useContext(StoreContext)

  const setShowDiff = useStore(store, (state) => state.setShowDiff);
  const showDiff = useStore(store, (state) => state.showDiff);
  const activeTab = useStore(store, (state) => state.activeCompareTab);

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
  return (<div className="flex space-x-2 py-1 items-center">
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
  const snapshot = useStore(store, (state) => state.currentSnapshot);
  const build = useStore(store, (state) => state.build);

  const activeTab = useStore(store, (state) => state.activeCompareTab);
  const setActiveTab = useStore(store, (state) => state.setActiveCompareTab);
  const userRole = useStore(store, (state) => state.userRole);

  const buildAPI = useStore(store, (state) => state.buildAPI);
  const setCurrentSnapshot = useStore(store, (state) => state.setCurrentSnapshot);
  const snapshotTargetGroups = useStore(store, (state) => state.snapshots);


  const currentSnapshotIndex = useMemo(() => {
    const index = snapshotTargetGroups.findIndex((group) => group.snapshots.some((snap) => snap.id === snapshot?.id));
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

  useEffect(() => {
    resetAlignment();
  }, [resetAlignment, snapshot]);

  if (!snapshot) {
    return null;
  }

  const currentSnapshotGroup = snapshotTargetGroups[currentSnapshotIndex];

  return (
    <main className="w-full ml-1 z-0 h-full grow-0 flex relative">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab as (value: string) => void}
        defaultValue={activeTab}
        className=" w-full h-full grow-0 relative max-h-full"
      >
        <header className="w-full border-b border-outline-variant">
          <div className="flex px-4 py-2 flex-col">
            <div className="flex justify-between items-center">
              <Title snapshot={snapshot} />

              <div className="space-x-2">
                <ReviewDropdown snapshots={currentSnapshotGroup} canReview={Boolean(build.isLatest) && userRole !== "viewer"} onReview={(status) => {
                  if (status === "approved") buildAPI.approveSnapshots(currentSnapshotGroup.snapshots.map((snap) => snap.id))
                  else buildAPI.rejectSnapshots(currentSnapshotGroup.snapshots.map((snap) => snap.id))



                  setCurrentSnapshot(
                    snapshotTargetGroups[currentSnapshotIndex + 1]?.snapshots[0] ||
                    snapshotTargetGroups[currentSnapshotIndex]?.snapshots[0]
                  )


                }} />

              </div>

            </div>

            <div className="flex items-center justify-between flex-wrap">

              <div className="mt-4 flex space-x-4 ">
                <TabSwitcher />
                <DisplayOptions resetAlignment={resetAlignment} />
              </div>
              {/* <div className="flex space-x-4 items-center justify-center"> */}
              {/* <SnapStatus status={snapshot.status} /> */}
              <TargetTabs snapshot={snapshot} />
              {/* </div> */}
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

  const groupedSnapshots = useStore(store, (state) => state.snapshots);

  const targetGroup = groupedSnapshots.find((group) => group.name === snapshot.name && group.status === snapshot.status && group.variant === snapshot.variant && group.viewport === snapshot.viewport);

  const setCurrentSnapshot = useStore(store, (state) => state.setCurrentSnapshot);

  if (!targetGroup) {
    return null;
  }

  return (
    <ul className="flex justify-center mt-4">
      {
        targetGroup.snapshots.sort((a, b) => (a.target || "").localeCompare(b.target || "")).map((snap) => {

          const TargetLogo = targetIconRepo[snap.targetIcon as keyof typeof targetIconRepo] as FC<{ className?: string }> | undefined;

          const isActive = snap.id === snapshot.id;

          return (
            <li key={snap.id}>

              <Button variant="ghost" aria-selected={isActive} className={
                isActive ? "text-on-surface" : "text-on-surface-variant"
              } onClick={() => setCurrentSnapshot(snap)} tooltip={snap.target}>
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