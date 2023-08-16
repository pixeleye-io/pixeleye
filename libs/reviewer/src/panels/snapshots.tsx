/* eslint-disable @next/next/no-img-element */
import { SnapshotPair } from "@pixeleye/api";
import { useReviewerStore } from "../store";
import { PanelHeader } from "./shared";
import { cx } from "class-variance-authority";
import { useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
        unoptimized
        src={snapshot.snapURL || ""}
        width={snapshot.snapWidth}
        height={snapshot.snapHeight}
        className="object-contain w-full max-h-[20rem] rounded brightness-50"
        alt={`Variant ${snapshot.variant} of ${snapshot.name}`}
      />
    </button>
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
    </div>
  );
}
