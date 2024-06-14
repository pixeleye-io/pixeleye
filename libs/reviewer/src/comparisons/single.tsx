import { RefObject, useContext, useMemo } from "react";
import { DraggableImage, DraggableImageRef } from "./draggableImage";
import { useStore } from "zustand";
import { StoreContext } from "../store";
import { ReactFlowProvider } from "reactflow";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "@pixeleye/ui/src/button";

interface SingleProps {
  draggableImageRef?: RefObject<DraggableImageRef>;
}

export function Single({ draggableImageRef }: SingleProps) {
  const store = useContext(StoreContext)!

  const snapshot = useStore(store, (state) => state.currentSnapshot)!;
  const singleSnapshot = useStore(store, (state) => state.singleSnapshot)!;
  const setSingleSnapshot = useStore(store, (state) => state.setSingleSnapshot)!;

  const validDiff = Boolean(
    snapshot.diffURL && snapshot.diffWidth && snapshot.diffHeight
  );

  const validBaselineSnapshot = Boolean(
    snapshot.baselineURL && snapshot.baselineWidth && snapshot.baselineHeight
  );

  const base = useMemo(() => ({
    src: snapshot.snapURL!,
    width: snapshot.snapWidth!,
    height: snapshot.snapHeight!,
    alt: "Head snapshot",
  }), [snapshot.snapURL, snapshot.snapWidth, snapshot.snapHeight])

  const overlay = useMemo(() => validDiff
    ? {
      src: snapshot.diffURL!,
      width: snapshot.diffWidth!,
      height: snapshot.diffHeight!,
      alt: "Highlighted difference",
    }
    : undefined, [snapshot.diffURL, snapshot.diffWidth, snapshot.diffHeight, validDiff])

  const secondBase = useMemo(() => validBaselineSnapshot
    ? {
      src: snapshot.baselineURL!,
      width: snapshot.baselineWidth!,
      height: snapshot.baselineHeight!,
      alt: "Baseline snapshot",
    } : undefined, [snapshot.baselineURL, snapshot.baselineWidth, snapshot.baselineHeight, validBaselineSnapshot])

  return (
    <div className="overflow-hidden w-full h-full">
      <div className="flex h-full w-full overflow-hidden">
        <ReactFlowProvider>
          <div className="flex flex-col h-full w-full justify-center items-center 4">
            <div className="flex items-center justify-center mb-2 space-x-2">
              <p className="bg-surface-container-low border rounded-md border-outline px-2 py-1 text-sm min-w-20 text-center">
                {singleSnapshot === "head" ? "Changes" : "Baseline"}
              </p>
              <Button size="icon" onClick={() => setSingleSnapshot(singleSnapshot === "head" ? "baseline" : "head")} variant="ghost">
                <ArrowsRightLeftIcon className="w-5 h-5 rotate-90" />
              </Button>
            </div>

            <DraggableImage
              ref={draggableImageRef}
              id={snapshot.id}
              base={base}
              secondBase={secondBase}
              overlay={overlay}
            />
          </div>
        </ReactFlowProvider>
      </div>
    </div >
  );
}
