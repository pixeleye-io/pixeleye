import { StoreContext } from "../store";
import { PanelHeader } from "./shared";
import { cx } from "class-variance-authority";
import { useRef, useEffect, useState, useContext } from "react";
import Image from "next/image";
import { ExtendedSnapshotPair } from "../reviewer";
import { Accordion, Status } from "@pixeleye/ui";
import { useStore } from "zustand";
import { Snapshot } from "@pixeleye/api";

interface AccordionSnapsProps {
  groupedSnapshots: ExtendedSnapshotPair[][];
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
  if (groupedSnapshots.length === 0) {
    return null;
  }

  return (
    <Accordion.Item value={name}>
      <Accordion.Trigger className="px-2" size="sm">
        <div className="flex space-x-2">
          <Status snapshotStatus status={name} />
          <span>{snapshotStatusText[name]}</span>
        </div>
      </Accordion.Trigger>
      <Accordion.Content>
        <ul className="flex flex-col space-y-4 overflow-y-auto grow">
          {groupedSnapshots.map((snapshots, i) => {
            const active = snapshots.some((snapshot) =>
              currentSnapshot?.id === snapshot.id
            );
            return (
              <li className="h-fit p-1" key={snapshots[0].id}>
                <SnapButton
                  active={active}
                  index={i}
                  total={groupedSnapshots.length}
                  setIndex={(i) => {
                    const newSnapGroup = groupedSnapshots.at(i)
                    newSnapGroup?.some((snapshot) =>
                      currentSnapshot?.id === snapshot.id
                    ) ? setCurrentSnapshot(currentSnapshot) : setCurrentSnapshot(newSnapGroup?.[0])
                  }
                  }
                  snapshot={active ? currentSnapshot! : snapshots[0]}
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
}: SnapButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const store = useContext(StoreContext)


  const optimize = useStore(store, (state) => state.optimize);

  useEffect(() => {
    if (active) {
      ref.current?.focus();
    }
  }, [active]);

  return (
    <button
      type="button"
      ref={ref}
      tabIndex={active ? 0 : -1}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp" && !e.ctrlKey && index > 0) {
          e.preventDefault();
          setIndex(index - 1);
          e.currentTarget.blur();
        } else if (e.key === "ArrowDown" && !e.ctrlKey && index < total - 1) {
          e.preventDefault();
          setIndex(index + 1);
          e.currentTarget.blur();
        }
      }}
      onClick={() => setIndex(index)}
      className={cx(
        "p-2 rounded transition flex w-full justify-center items-center border border-outline-variant/50 hover:bg-surface-container-high focus-visible:outline-outline focus-visible:outline",
        active && "lg:bg-surface-container-low bg-surface-container !border-outline"
      )}
    >
      <Image
        quality={50}
        placeholder={optimize ? "blur" : "empty"}
        unoptimized={!optimize}
        src={snapshot.snapURL || ""}
        width={snapshot.snapWidth}
        height={snapshot.snapHeight}
        className="object-contain w-full max-h-[20rem] rounded brightness-[65%] p-1"
        alt={`Name: ${snapshot.name}, Variant ${snapshot.variant}`}
      />
    </button>
  );
}

function ShortcutHint() {
  return (
    <div className="sticky inset-x-4 bottom-4 z-10 pointer-events-none">
      <div className="flex justify-center px-2 py-1 mx-4 rounded-lg shadow lg:bg-surface-container-low bg-surface-container-high">
        <p className="space-x-4 text-on-surface-variant">
          <kbd>
            <kbd>Ctrl</kbd> <kbd>↑</kbd> <kbd>↓</kbd>
          </kbd>
          <span className="sr-only"> to navigate between screenshots</span>
        </p>
      </div>
    </div>
  );
}

export default function SnapshotsPanel() {
  const store = useContext(StoreContext)
  const groupedSnapshots = useStore(store, (state) => state.snapshots);
  const currentSnapshot = useStore(store, (state) => state.currentSnapshot);

  const setCurrentSnapshot = useStore(store,
    (state) => state.setCurrentSnapshot
  );

  const [unreviewed, approved, rejected, unchanged, missingBaseline, orphaned, failed] =
    groupedSnapshots.reduce(
      (acc, { snapshots, status }) => {

        switch (status) {
          case "unreviewed":
            acc[0].push(snapshots);
            break;
          case "approved":
            acc[1].push(snapshots);
            break;
          case "rejected":
            acc[2].push(snapshots);
            break;
          case "unchanged":
            acc[3].push(snapshots);
            break;
          case "missing_baseline":
            acc[4].push(snapshots);
            break;
          case "orphaned":
            acc[5].push(snapshots);
            break;
          case "failed":
            acc[6].push(snapshots);
            break;
        }
        return acc;
      },
      [[], [], [], [], [], [], []] as [
        ExtendedSnapshotPair[][],
        ExtendedSnapshotPair[][],
        ExtendedSnapshotPair[][],
        ExtendedSnapshotPair[][],
        ExtendedSnapshotPair[][],
        ExtendedSnapshotPair[][],
        ExtendedSnapshotPair[][],
      ]
    );

  const [accordionValue, setAccordionValue] = useState<string | undefined>(
    currentSnapshot?.status
  );

  useEffect(() => {
    if (currentSnapshot?.status) setAccordionValue(currentSnapshot?.status);
  }, [currentSnapshot]);


  return (
    <div className="pl-0.5 pt-4 flex flex-col grow">
      <PanelHeader className="px-4" title="Snapshots" />
      <nav className="grow mt-4 flex pb-12 border-t border-outline-variant">
        <Accordion
          type="single"
          value={accordionValue}
          onValueChange={setAccordionValue}
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
