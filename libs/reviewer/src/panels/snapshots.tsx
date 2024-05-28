import { SnapshotTargetGroup, StoreContext } from "../store";
import { cx } from "class-variance-authority";
import { useRef, useEffect, useState, useContext, useMemo } from "react";
import Image from "next/image";
import { ExtendedSnapshotPair } from "../reviewer";
import { Accordion, Button, Status } from "@pixeleye/ui";
import { useStore } from "zustand";
import { Snapshot } from "@pixeleye/api";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/20/solid";
import Fuse from "fuse.js"

interface AccordionSnapsProps {
  groupedSnapshots: SnapshotTargetGroup[][];
  name: Snapshot["status"];
  currentSnapshot: ExtendedSnapshotPair | undefined;
  setCurrentSnapshot: (snapshot?: ExtendedSnapshotPair) => void;
}

export const snapshotStatusText: Record<Snapshot["status"], string> = {
  unreviewed: "Unreviewed",
  approved: "Approved",
  rejected: "Rejected",
  unchanged: "Unchanged",
  missing_baseline: "Missing Baseline",
  orphaned: "Orphaned",
  failed: "Failed",
  aborted: "Aborted",
  processing: "Processing",
}

function AccordionSnaps({
  groupedSnapshots,
  name,
  currentSnapshot,
  setCurrentSnapshot,
}: AccordionSnapsProps) {

  if (groupedSnapshots.length === 0)
    return null;


  return (
    <Accordion.Item value={name}>
      <Accordion.Trigger className="px-2" size="sm">
        <div className="flex space-x-2 items-center">
          <Status snapshotStatus status={name} />
          <span>{snapshotStatusText[name]}</span>
        </div>
      </Accordion.Trigger>
      <Accordion.Content>
        <ul className="flex flex-col space-y-4 overflow-y-auto grow">
          {groupedSnapshots.map((snapshots, i) => {
            const active = snapshots.some(({ snapshots }) =>
              snapshots.some((snapshot) => currentSnapshot?.id === snapshot.id)
            );
            return (
              <li className="h-fit p-1 relative z-0" key={snapshots[0].snapshots[0].id}>
                <SnapButton
                  groupCount={groupedSnapshots[i].length}
                  active={active}
                  index={i}
                  total={groupedSnapshots.length}
                  setIndex={(i) => {
                    const newSnapGroup = groupedSnapshots.at(i)
                    newSnapGroup?.some(({ snapshots }) =>
                      snapshots.some((snapshot) => currentSnapshot?.id === snapshot.id)
                    ) ? setCurrentSnapshot(currentSnapshot) : setCurrentSnapshot(newSnapGroup?.[0]?.snapshots[0])
                  }
                  }
                  snapshot={active ? currentSnapshot! : snapshots[0].snapshots[0]}
                />
              </li>
            )
          })}
        </ul>
      </Accordion.Content>
    </Accordion.Item>
  );
}

interface SnapButtonProps {
  snapshot: ExtendedSnapshotPair;
  groupCount: number;
  index: number;
  active: boolean;
  total: number;
  setIndex: (index: number) => void;
}

function SnapButton({
  snapshot,
  index,
  total,
  setIndex,
  active,
  groupCount
}: SnapButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const store = useContext(StoreContext)!

  const optimize = useStore(store, (state) => state.optimize);

  return (
    <button
      type="button"
      ref={ref}
      tabIndex={active ? 0 : -1}
      onClick={() => setIndex(index)}
      className={cx(
        "p-2 rounded relative transition flex w-full justify-center items-center border border-outline-variant/50 hover:bg-surface-container-high focus-visible:outline-outline focus-visible:outline",
        active && "lg:bg-surface-container-low bg-surface-container !border-outline"
      )}
    >
      <Image
        quality={50}
        unoptimized={!optimize}
        src={snapshot.snapURL || ""}
        width={snapshot.snapWidth}
        height={snapshot.snapHeight}
        className="object-contain w-full max-h-[20rem] rounded brightness-[65%] p-1"
        alt={`Name: ${snapshot.name}, Variant ${snapshot.variant}`}
      />
      {
        groupCount > 1 && (
          <span className="absolute bottom-4 text-xs shadow-xl border border-outline-variant rounded-lg left-8 right-8 p-1.5 bg-surface-container-high text-on-surface z-50">
            {groupCount} similar diffs
          </span>
        )
      }
    </button>
  );
}

function ShortcutHint() {
  return (
    <div className="sticky inset-x-4 bottom-4 z-10 pointer-events-none">
      <div className="flex justify-center px-2 py-1 mx-4 rounded-lg shadow lg:bg-surface-container-low bg-surface-container-high">
        <p className="space-x-4 text-on-surface-variant">
          <kbd>
            <kbd>Arrows</kbd> <kbd>↑</kbd> <kbd>↓</kbd>
          </kbd>
          <span className="sr-only"> to navigate between screenshots</span>
        </p>
      </div>
    </div>
  );
}



export default function SnapshotsPanel() {
  const store = useContext(StoreContext)!
  const groupedSnapshots = useStore(store, (state) => state.snapshots);
  const currentSnapshot = useStore(store, (state) => state.currentSnapshot);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const setCurrentSnapshot = useStore(store,
    (state) => state.setCurrentSnapshot
  );






  const filtered =
    useMemo(() => {

      const filteredSnaps = new Fuse(groupedSnapshots.flatMap(({ targetGroups }) => targetGroups), {
        keys: ["name", "variant", "viewport"],
        threshold: 0.3,
      });

      return filteredSnaps.search(
        search
      ).reduce(
        (acc, { item: group }) => {
          switch (group.status) {
            case "unreviewed":
              acc[0].push([group]);
              break;
            case "approved":
              acc[1].push([group]);
              break;
            case "rejected":
              acc[2].push([group]);
              break;
            case "unchanged":
              acc[3].push([group]);
              break;
            case "missing_baseline":
              acc[4].push([group]);
              break;
            case "orphaned":
              acc[5].push([group]);
              break;
            case "failed":
              acc[6].push([group]);
              break;
          }
          return acc;
        },
        [[], [], [], [], [], [], []] as [
          SnapshotTargetGroup[][],
          SnapshotTargetGroup[][],
          SnapshotTargetGroup[][],
          SnapshotTargetGroup[][],
          SnapshotTargetGroup[][],
          SnapshotTargetGroup[][],
          SnapshotTargetGroup[][],
        ]
      )
    }
      , [groupedSnapshots, search]);

  const unFiltered =
    useMemo(() => groupedSnapshots.reduce(
      (acc, { targetGroups, status }) => {
        switch (status) {
          case "unreviewed":
            acc[0].push(targetGroups);
            break;
          case "approved":
            acc[1].push(targetGroups);
            break;
          case "rejected":
            acc[2].push(targetGroups);
            break;
          case "unchanged":
            acc[3].push(targetGroups);
            break;
          case "missing_baseline":
            acc[4].push(targetGroups);
            break;
          case "orphaned":
            acc[5].push(targetGroups);
            break;
          case "failed":
            acc[6].push(targetGroups);
            break;
        }
        return acc;
      },
      [[], [], [], [], [], [], []] as [
        SnapshotTargetGroup[][],
        SnapshotTargetGroup[][],
        SnapshotTargetGroup[][],
        SnapshotTargetGroup[][],
        SnapshotTargetGroup[][],
        SnapshotTargetGroup[][],
        SnapshotTargetGroup[][],
      ]
    ), [groupedSnapshots]);


  const [accordionValue, setAccordionValue] = useState<string | undefined>(
    currentSnapshot?.status
  );

  useEffect(() => {
    if (currentSnapshot?.status) setAccordionValue(currentSnapshot?.status);
  }, [currentSnapshot]);



  const [unreviewed, approved, rejected, unchanged, missingBaseline, orphaned, failed] = searchOpen ? filtered : unFiltered;

  return (
    <div className="pt-2 flex flex-col w-full">
      <header className="flex w-full items-center px-2">
        <Button type="button" aria-pressed={searchOpen} onClick={() => setSearchOpen(v => !v)} variant="ghost" size="icon" className="mr-2 !h-8 !w-8">
          <span className="sr-only">
            {searchOpen ? "Close search" : "Open search"}
          </span>
          {
            searchOpen ? <XMarkIcon className="w-5 h-5" /> : <MagnifyingGlassIcon className="w-5 h-5" />
          }
        </Button>
        {
          searchOpen && (
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="search"
              className="bg-transparent w-full border-none outline-none ring-0"
              placeholder="Search snapshots..."
            />
          )
        }
        {
          !searchOpen && (
            <h3 className="font-medium text-md w-full">Snapshots</h3>
          )
        }
      </header>

      <nav className="grow mt-2 flex pb-12 border-t border-outline-variant w-full">
        <Accordion
          type="single"
          value={accordionValue}
          onValueChange={setAccordionValue}

          defaultValue={currentSnapshot?.status}
          collapsible
          className="w-full"
        >
          <AccordionSnaps
            groupedSnapshots={unreviewed}
            name="unreviewed"
            currentSnapshot={currentSnapshot}
            setCurrentSnapshot={setCurrentSnapshot}
          />
          <AccordionSnaps
            groupedSnapshots={rejected}
            name="rejected"
            currentSnapshot={currentSnapshot}
            setCurrentSnapshot={setCurrentSnapshot}
          />
          <AccordionSnaps
            groupedSnapshots={approved}
            name="approved"
            currentSnapshot={currentSnapshot}
            setCurrentSnapshot={setCurrentSnapshot}
          />
          <AccordionSnaps
            groupedSnapshots={missingBaseline}
            name="missing_baseline"
            currentSnapshot={currentSnapshot}
            setCurrentSnapshot={setCurrentSnapshot}
          />
          <AccordionSnaps
            groupedSnapshots={orphaned}
            name="orphaned"
            currentSnapshot={currentSnapshot}
            setCurrentSnapshot={setCurrentSnapshot}
          />
          <AccordionSnaps
            groupedSnapshots={unchanged}
            name="unchanged"
            currentSnapshot={currentSnapshot}
            setCurrentSnapshot={setCurrentSnapshot}
          />
          <AccordionSnaps
            groupedSnapshots={failed}
            name="failed"
            currentSnapshot={currentSnapshot}
            setCurrentSnapshot={setCurrentSnapshot}
          />
        </Accordion>
      </nav>
      <ShortcutHint />
    </div>
  );
}
