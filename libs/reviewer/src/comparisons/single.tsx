import { RefObject, useContext } from "react";
import { DraggableImage, DraggableImageRef } from "./draggableImage";
import { useStore } from "zustand";
import { StoreContext } from "../store";
import { ReactFlowProvider } from "reactflow";

interface SingleProps {
  draggableImageRef?: RefObject<DraggableImageRef>;
}

export function Single({ draggableImageRef }: SingleProps) {
  const store = useContext(StoreContext)

  const snapshot = useStore(store, (state) => state.currentSnapshot)!;
  const singleSnapshot = useStore(store, (state) => state.singleSnapshot)!;

  const validDiff = Boolean(
    snapshot.diffURL && snapshot.diffWidth && snapshot.diffHeight
  );

  const validBaselineSnapshot = Boolean(
    snapshot.baselineURL && snapshot.baselineWidth && snapshot.baselineHeight
  );

  return (
    <div className="overflow-hidden w-full h-full">
      <div className="flex h-full w-full overflow-hidden">
        <ReactFlowProvider>
          <div className="flex flex-col h-full w-full justify-center items-center">
            <p className="bg-surface-container-low border rounded-md border-outline px-2 py-1 text-sm mb-2">
              {singleSnapshot === "head" ? "Changes" : "Baseline"}
            </p>
            <DraggableImage
              ref={draggableImageRef}
              id={snapshot.id}
              base={{
                src: snapshot.snapURL!,
                width: snapshot.snapWidth!,
                height: snapshot.snapHeight!,
                alt: "Head snapshot",
              }}
              secondBase={
                validBaselineSnapshot
                  ? {
                    src: snapshot.baselineURL!,
                    width: snapshot.baselineWidth!,
                    height: snapshot.baselineHeight!,
                    alt: "Baseline snapshot",
                  } : undefined
              }
              overlay={
                validDiff
                  ? {
                    src: snapshot.diffURL!,
                    width: snapshot.diffWidth!,
                    height: snapshot.diffHeight!,
                    alt: "Highlighted difference",
                  }
                  : undefined
              }
            />
          </div>
        </ReactFlowProvider>
      </div>
    </div >
  );
}
