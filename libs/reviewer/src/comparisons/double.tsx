import { useReviewerStore } from "../store";
import { DraggableImage } from "./draggableImage";
import { MotionValue } from "framer-motion";

interface DoubleProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
  scale: MotionValue<number>;
}

export function Double({ x, y, scale }: DoubleProps) {
  const snapshot = useReviewerStore((state) => state.currentSnapshot)!;

  const validSnapshot = Boolean(
    snapshot.snapURL && snapshot.snapWidth && snapshot.snapHeight
  );

  const validDiff = Boolean(
    snapshot.diffURL && snapshot.diffWidth && snapshot.diffHeight
  );

  const validBaseline = Boolean(
    snapshot.baselineURL && snapshot.baselineWidth && snapshot.baselineHeight
  );

  // TODO - add placeholder for invalid snapshot

  return (
    <div className="overflow-hidden w-full h-full">
      <div></div>
      <div className="flex h-full w-full space-x-8 overflow-hidden">
        {validBaseline && (
          <DraggableImage
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
