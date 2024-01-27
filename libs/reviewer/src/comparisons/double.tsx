import { DraggableImage, DraggableImageRef } from "./draggableImage";
import { RefObject, useContext, useState } from "react";
import { useStore } from "zustand";
import { StoreContext } from "../store";
import { ReactFlowProvider, Viewport } from "reactflow";

interface DoubleProps {
  draggableImageRef?: RefObject<DraggableImageRef>;
}

export function Double({ draggableImageRef }: DoubleProps) {
  const store = useContext(StoreContext)

  const snapshot = useStore(store, (state) => state.currentSnapshot)!;

  const validSnapshot = Boolean(
    snapshot.snapURL && snapshot.snapWidth && snapshot.snapHeight
  );

  const validDiff = Boolean(
    snapshot.diffURL && snapshot.diffWidth && snapshot.diffHeight
  );

  const validBaseline = Boolean(
    snapshot.baselineURL && snapshot.baselineWidth && snapshot.baselineHeight
  );

  const [viewport, setViewport] = useState<Viewport | undefined>(undefined)


  return (
    <div className="overflow-hidden w-full h-full">
      <div className="flex flex-col sm:flex-row h-full w-full space-y-4 sm:space-x-4 sm:space-y-0 overflow-hidden">
        <ReactFlowProvider>

          {validSnapshot && (
            <DraggableImage
              ref={draggableImageRef}
              onMove={(_, view) => setViewport(view)}
              base={{
                src: snapshot.snapURL!,
                width: snapshot.snapWidth!,
                height: snapshot.snapHeight!,
                alt: "New snapshot",
              }}
              overlay={
                validDiff
                  ? {
                    src: snapshot.diffURL!,
                    width: snapshot.diffWidth!,
                    height: snapshot.diffHeight!,
                    alt: "Highlighted difference between snapshots",
                  }
                  : undefined
              }
            />
          )}
        </ReactFlowProvider>
        <ReactFlowProvider>
          {
            !validBaseline && (
              <div className="flex flex-col items-center justify-center w-full h-full pt-8">
                <div className="flex flex-col items-center justify-center w-full h-full bg-surface-container rounded mt-1 border border-outline-variant">
                  <p className="text-center text-gray-400">No baseline snapshot</p>
                </div>
              </div>
            )
          }
          {validBaseline && (
            <DraggableImage
              viewport={viewport}
              base={{
                src: snapshot.baselineURL!,
                width: snapshot.baselineWidth!,
                height: snapshot.baselineHeight!,
                alt: "Baseline snapshot",
              }}
            />
          )}
        </ReactFlowProvider>

      </div>
    </div >
  );
}
