/* eslint-disable @next/next/no-img-element */
import { SnapshotPair } from "@pixeleye/api";
import { useReviewerStore } from "../store";
import { PanelHeader } from "./shared";
import { cx } from "class-variance-authority";
import { useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";
import Image from "next/image";

interface SnapButtonProps {
  snapshot: SnapshotPair;
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
    <div className="absolute inset-0 z-10 pointer-events-none">
      <div className="h-[calc(max(100vh-4.5rem,100%))]"></div>
      <div className="sticky flex justify-center px-2 py-1 mx-4 rounded-lg shadow bg-surface-container-low bottom-4">
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
  const build = useReviewerStore((state) => state.build);

  const searchParams = useSearchParams();

  const snapshotId = searchParams.get("s");

  const router = useRouter();

  useEffect(() => {
    if (
      snapshots.length > 0 &&
      (!snapshotId || !snapshots.find((s) => s.id === snapshotId))
    ) {
      router.replace(`/builds/${build.id}?s=${snapshots[0]!.id}`);
    }
  }, [snapshotId, snapshots, build, router]);

  const setCurrentSnapshot = useCallback(
    (index: number) => {
      router.replace(`/builds/${build.id}?s=${snapshots[index]!.id}`);
    },
    [build, snapshots, router]
  );

  const currentSnapshotIndex = snapshots.findIndex((s) => s.id === snapshotId);

  useHotkeys(
    "ctrl+ArrowDown",
    () =>
      setCurrentSnapshot(
        Math.min(currentSnapshotIndex + 1, snapshots.length - 1)
      ),
    [currentSnapshotIndex, snapshots.length, setCurrentSnapshot]
  );

  useHotkeys(
    "ctrl+ArrowUp",
    () => setCurrentSnapshot(Math.max(currentSnapshotIndex - 1, 0)),
    [currentSnapshotIndex, setCurrentSnapshot]
  );

  return (
    <div className="px-4 pt-4 flex flex-col">
      <PanelHeader title="Snapshots" />
      <nav className="grow-1 mt-4">
        <ul className="flex flex-col space-y-4">
          {snapshots.map((snapshot, i) => (
            <li className="h-fit" key={snapshot.id}>
              <SnapButton
                active={snapshot.id === snapshotId}
                index={i}
                total={snapshots.length}
                setIndex={setCurrentSnapshot}
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
