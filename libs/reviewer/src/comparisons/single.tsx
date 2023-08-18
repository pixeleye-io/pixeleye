import { RefObject } from "react";
import { useReviewerStore } from "../store";
import { DraggableImage, DraggableImageRef } from "./draggableImage";
import { useMotionValue } from "framer-motion";

interface SingleProps {
  draggableImageRef?: RefObject<DraggableImageRef>;
}

export function Single({ draggableImageRef }: SingleProps) {
  const snapshot = useReviewerStore((state) => state.currentSnapshot)!;
  const singleSnapshot = useReviewerStore((state) => state.singleSnapshot);
  const setSingleSnapshot = useReviewerStore(
    (state) => state.setSingleSnapshot
  );

  const validHeadSnapshot = Boolean(
    snapshot.snapURL && snapshot.snapWidth && snapshot.snapHeight
  );

  const validBaselineSnapshot = Boolean(
    snapshot.baselineURL && snapshot.baselineWidth && snapshot.baselineHeight
  );

  const validDiff = Boolean(
    snapshot.diffURL && snapshot.diffWidth && snapshot.diffHeight
  );

  const scale = useMotionValue(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // TODO - add placeholder for invalid snapshot

  return (
    <div className="overflow-hidden w-full h-full">
      <div></div>
      <div className="flex h-full w-full overflow-hidden">
        {validHeadSnapshot && (
          <DraggableImage
            className={singleSnapshot === "head" ? "" : "hidden"}
            onTap={() => setSingleSnapshot("baseline")}
            ref={draggableImageRef}
            x={x}
            y={y}
            scale={scale}
            base={{
              src: snapshot.snapURL!,
              width: snapshot.snapWidth!,
              height: snapshot.snapHeight!,
              alt: "Head snapshot",
            }}
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
        )}
        {validBaselineSnapshot && (
          <DraggableImage
            className={singleSnapshot === "baseline" ? "" : "hidden"}
            onTap={() => setSingleSnapshot("head")}
            ref={draggableImageRef}
            x={x}
            y={y}
            scale={scale}
            base={{
              src: snapshot.baselineURL!,
              width: snapshot.baselineWidth!,
              height: snapshot.baselineHeight!,
              alt: "Baseline snapshot",
            }}
          />
        )}
      </div>
    </div>
  );
}
