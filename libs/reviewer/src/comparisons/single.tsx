import { RefObject, useContext } from "react";
import { ChatBubble, DraggableImage, DraggableImageRef } from "./draggableImage";
import { useMotionValue } from "framer-motion";
import { useStore } from "zustand";
import { StoreContext } from "../store";

interface SingleProps {
  draggableImageRef?: RefObject<DraggableImageRef>;
}

export function Single({ draggableImageRef }: SingleProps) {
  const store = useContext(StoreContext)

  const snapshot = useStore(store, (state) => state.currentSnapshot)!;
  const singleSnapshot = useStore(store, (state) => state.singleSnapshot);
  const build = useStore(store, (state) => state.build);
  const setSingleSnapshot = useStore(store,
    (state) => state.setSingleSnapshot
  );

  const validHeadSnapshot = Boolean(
    snapshot.snapURL && snapshot.snapWidth && snapshot.snapHeight
  );

  const validDiff = Boolean(
    snapshot.diffURL && snapshot.diffWidth && snapshot.diffHeight
  );

  const validBaselineSnapshot = Boolean(
    snapshot.baselineURL && snapshot.baselineWidth && snapshot.baselineHeight
  );

  const scale = useMotionValue(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const bubbles: ChatBubble[] = [
    {
      id: "1",
      content: "test",
      top: 0,
      left: 50,
    },
    {
      id: "2",
      content: "test",
      top: 40,
      left: 100,
    },
  ]

  // TODO - add placeholder for invalid snapshot

  return (
    <div className="overflow-hidden w-full h-full">
      <div className="flex h-full w-full overflow-hidden">
        <DraggableImage
          branch={build.branch}
          onTap={() => validBaselineSnapshot && setSingleSnapshot(singleSnapshot === "head" ? "baseline" : "head")
          }
          ref={draggableImageRef}
          x={x}
          y={y}
          chatBubbles={bubbles}
          scale={scale}
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
          showSecondBase={singleSnapshot === "baseline"}
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
    </div>
  );
}
