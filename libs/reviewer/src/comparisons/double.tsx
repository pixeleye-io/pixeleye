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
            <div className="flex flex-col w-full h-full justify-center items-center">
              <p className="bg-surface-container-low border rounded-md border-outline px-2 py-1 text-sm mb-2">
                Changes
              </p>

              <DraggableImage
                ref={draggableImageRef}
                onMove={(_, view) => setViewport(view)}
                viewport={viewport}
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
            </div>

          )}
        </ReactFlowProvider>
        <ReactFlowProvider>
          {
            !validBaseline && (
              <div className="flex flex-col items-center flex-1 justify-center w-full h-full pt-8">
                <div className="flex flex-col items-center justify-center w-full h-full bg-surface-container rounded mt-1 border border-outline-variant">
                  <p className="text-center text-gray-400">No baseline snapshot</p>
                </div>
              </div>
            )
          }
          {validBaseline && (
            <div className="flex flex-col h-full w-full justify-center items-center">
              <p className="bg-surface-container-low border rounded-md border-outline px-2 py-1 text-sm mb-2">
                Baseline
              </p>
              <DraggableImage
                onMove={(_, view) => setViewport(view)}
                viewport={viewport}
                base={{
                  src: snapshot.baselineURL!,
                  width: snapshot.baselineWidth!,
                  height: snapshot.baselineHeight!,
                  alt: "Baseline snapshot",
                }}
              />
            </div>
          )}
        </ReactFlowProvider>

      </div>
    </div >
  );
}
