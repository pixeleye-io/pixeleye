import { useReviewerStore } from "../store";
import { DraggableImage } from "./draggableImage";
import { MotionValue } from "framer-motion";

interface SingleProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
  scale: MotionValue<number>;
}

export function Single({ x, y, scale }: SingleProps) {
  const snapshot = useReviewerStore((state) => state.currentSnapshot)!;

  const validSnapshot = Boolean(
    snapshot.snapURL && snapshot.snapWidth && snapshot.snapHeight
  );

  const validDiff = Boolean(
    snapshot.diffURL && snapshot.diffWidth && snapshot.diffHeight
  );

  // TODO - add placeholder for invalid snapshot

  return (
    <div className="overflow-hidden w-full h-full">
      <div></div>
      <div className="flex h-full w-full overflow-hidden">
        {validSnapshot && (
          <DraggableImage
            x={x}
            y={y}
            scale={scale}
            base={{
              src: snapshot.snapURL!,
              width: snapshot.snapWidth!,
              height: snapshot.snapHeight!,
              alt: "Baseline snapshot",
            }}
            overlay={
              validDiff
                ? {
                    src: snapshot.diffURL!,
                    width: snapshot.diffWidth!,
                    height: snapshot.diffHeight!,
                    alt: "Baseline snapshot",
                  }
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
