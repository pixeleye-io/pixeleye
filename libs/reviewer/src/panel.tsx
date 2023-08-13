"use client";

import { m, useMotionValue, useMotionValueEvent } from "framer-motion";
import { FC } from "react";
import BuildInfoPanel from "./panels/buildInfo";
import SnapshotsPanel from "./panels/snapshots";
import FeedPanel from "./panels/feed";
import { useReviewerStore } from "./store";

export type Panel = "snapshots" | "build-info" | "feed";

const panelRepo: Record<Panel, FC> = {
  snapshots: SnapshotsPanel,
  "build-info": BuildInfoPanel,
  feed: FeedPanel,
};

function initialWidth() {
  if (typeof window === "undefined") return 300;
  const width = localStorage.getItem("panelWidth");

  if (width && !isNaN(Number(width))) {
    return Number(width);
  }

  return 300;
}

export function Panel() {
  const width = useMotionValue(initialWidth());
  const panel = useReviewerStore((state) => state.panel);

  const PanelComponent = panelRepo[panel];

  useMotionValueEvent(width, "change", (value) => {
    localStorage.setItem("panelWidth", value.toString());
  });

  return (
    <m.aside style={{ width: width }} className="flex relative z-0">
      <div className="flex-1 z-10">
        <PanelComponent />
      </div>
      <span className="absolute inset-0 flex">
        <m.span
          drag="x"
          dragElastic={0.025}
          dragMomentum={false}
          dragConstraints={{
            left: 200,
            right: 450,
          }}
          whileDrag={{
            backgroundColor: "rgb(var(--color-outline-variant))",
          }}
          whileHover={{
            backgroundColor: "rgb(var(--color-outline-variant))",
          }}
          style={{ x: width }}
          className="w-1.5  relative inset-y-0 justify-center items-center group flex flex-col cursor-col-resize transition-colors"
        >
          <span className=" h-full w-px bg-outline-variant transition-colors" />
        </m.span>
      </span>
    </m.aside>
  );
}
