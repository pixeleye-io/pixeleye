import { useReviewerStore } from "../store";
import { PanelHeader } from "./shared";
import { cx } from "class-variance-authority";
import { useRef, useEffect } from "react";
import Image from "next/image";
import { ExtendedSnapshotPair } from "../reviewer";

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

  const optimize = useReviewerStore((state) => state.optimize);

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
        "p-2 rounded transition flex w-full justify-center items-center hover:bg-surface-container-high focus-visible:outline-outline focus-visible:outline",
        active && "bg-surface-container-low"
      )}
    >
      <Image
        quality={50}
        placeholder={optimize ? "blur" : "empty"}
        unoptimized={!optimize}
        src={snapshot.snapURL || ""}
        width={snapshot.snapWidth}
        height={snapshot.snapHeight}
        className="object-contain w-full max-h-[20rem] rounded brightness-50"
        alt={`Name: ${snapshot.name}, Variant ${snapshot.variant}`}
      />
    </button>
  );
}

function ShortcutHint() {
  return (
    <div className="sticky inset-x-4 bottom-4 z-10 pointer-events-none">
      <div className="flex justify-center px-2 py-1 mx-4 rounded-lg shadow bg-surface-container-low">
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
  const snapshots = useReviewerStore((state) => state.snapshots);
  const currentSnapshot = useReviewerStore((state) => state.currentSnapshot);

  const setCurrentSnapshot = useReviewerStore(
    (state) => state.setCurrentSnapshot
  );

  return (
    <div className="px-4 pt-4 flex flex-col grow">
      <PanelHeader title="Snapshots" />
      <nav className="grow mt-4 flex pb-12">
        <ul className="flex flex-col space-y-4 overflow-y-auto  grow">
          {snapshots.map((snapshot, i) => (
            <li className="h-fit" key={snapshot.id}>
              <SnapButton
                active={snapshot.id === currentSnapshot?.id}
                index={i}
                total={snapshots.length}
                setIndex={(i) => setCurrentSnapshot(snapshots.at(i))}
                snapshot={snapshot}
              />
            </li>
          ))}
        </ul>
      </nav>
      <ShortcutHint />
    </div>
  );
}
