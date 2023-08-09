"use client";

import { Build, Snapshot } from "@pixeleye/api";
import { Header } from "@pixeleye/ui";
import {
  m,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";

export interface ReviewerProps {
  build: Build;
  snapshots: Snapshot[];
}

function initialWidth() {
  if (typeof window === "undefined") return 300;
  const width = localStorage.getItem("panelWidth");

  if (width && !isNaN(Number(width))) {
    return Number(width);
  }

  return 300;
}

export function Reviewer({ build, snapshots }: ReviewerProps) {
  const width = useMotionValue(initialWidth());

  useMotionValueEvent(width, "change", (value) => {
    localStorage.setItem("panelWidth", value.toString());
  });

  return (
    <div className="min-h-[calc(100vh)] w-full h-full flex flex-col">
      <m.aside style={{ width: width }} className="h-full grow flex flex-col">
        <m.span
          drag="x"
          dragElastic={0.025}
          dragMomentum={false}
          dragConstraints={{
            left: 200,
            right: 450,
          }}
          whileDrag={{
            backgroundColor: "rgb(var(--color-outline))",
          }}
          whileHover={{
            backgroundColor: "rgb(var(--color-outline))",
          }}
          style={{x : width}}
          className="h-full grow w-1 relative justify-center items-center group flex flex-col cursor-col-resize transition-colors"
        >
          <span className="grow h-full w-px bg-outline-variant transition-colors" />
        </m.span>
      </m.aside>
    </div>
  );
}
