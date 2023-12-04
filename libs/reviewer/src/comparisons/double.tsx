import { useReviewerStore } from "../store";
import { DraggableImage, DraggableImageRef } from "./draggableImage";
import { useMotionValue } from "framer-motion";
import { RefObject } from "react";

interface DoubleProps {
  draggableImageRef?: RefObject<DraggableImageRef>;
}

export function Double({ draggableImageRef }: DoubleProps) {
  const snapshot = useReviewerStore((state) => state.currentSnapshot)!;
  const build = useReviewerStore((state) => state.build);

  const validSnapshot = Boolean(
    snapshot.snapURL && snapshot.snapWidth && snapshot.snapHeight
  );

  const validDiff = Boolean(
    snapshot.diffURL && snapshot.diffWidth && snapshot.diffHeight
  );

  const validBaseline = Boolean(
    snapshot.baselineURL && snapshot.baselineWidth && snapshot.baselineHeight
  );

  const scale = useMotionValue(0);
  const x = useMotionValue(0);
  const y = useMotionValue(8);
  // TODO - add placeholder for invalid snapshot

  return (
    <div className="overflow-hidden w-full h-full">
      <div className="flex flex-col sm:flex-row h-full w-full space-y-4 sm:space-x-4 sm:space-y-0 overflow-hidden">
        {validBaseline && (
          <DraggableImage
            baseline
            branch={build.branch}
            ref={draggableImageRef}
            base={{
              src: snapshot.baselineURL!,
              width: snapshot.baselineWidth!,
              height: snapshot.baselineHeight!,
              alt: "Baseline snapshot",
            }}
            x={x}
            y={y}
            scale={scale}
          />
        )}
        {validSnapshot && (
          <DraggableImage
            ref={draggableImageRef}
            baseline={false}
            branch={build.branch}
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
            x={x}
            y={y}
            scale={scale}
          />
        )}
      </div>
    </div>
  );
}
