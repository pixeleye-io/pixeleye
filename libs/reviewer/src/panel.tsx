"use client";

import { m, useMotionValue, useMotionValueEvent } from "framer-motion";
import { FC, useContext, useEffect } from "react";
import BuildInfoPanel from "./panels/buildInfo";
import SnapshotsPanel from "./panels/snapshots";
import FeedPanel from "./panels/feed";
import { StoreContext } from "./store";
import OverlayScrollbar from "@pixeleye/ui/src/scrollArea/scrollArea";
import { useStore } from "zustand";

export type Panel = "snapshots" | "build-info" | "feed";

const panelRepo: Record<Panel, FC> = {
  snapshots: SnapshotsPanel,
  "build-info": BuildInfoPanel,
  feed: FeedPanel,
};

function initialWidth() {
  if (typeof window === "undefined") return 250;
  const width = localStorage.getItem("panelWidth");

  if (width && !isNaN(Number(width))) {
    return Number(width);
  }

  return 250;
}

export function Panel() {
  const width = useMotionValue(initialWidth());
  const store = useContext(StoreContext)

  const panel = useStore(store, (state) => state.panel);

  const PanelComponent = panelRepo[panel];

  useMotionValueEvent(width, "change", (value) => {
    localStorage.setItem("panelWidth", value.toString());
  });

  return (
    <m.aside style={{ width: width }} className="flex relative z-10 shrink-0">
      <OverlayScrollbar className="flex grow z-10 overflow-y-auto [&>*:nth-child(2)]:flex">
        <PanelComponent />
      </OverlayScrollbar>
      <span className="absolute inset-0 flex">
        <m.span
          drag="x"
          dragElastic={0.025}
          dragMomentum={false}
          dragConstraints={{
            left: 150,
            right: 450,
          }}
          whileDrag={{
            backgroundColor: "rgb(var(--color-outline-variant))",
          }}
          whileHover={{
            backgroundColor: "rgb(var(--color-outline-variant))",
          }}
          style={{ x: width }}
          className="w-1.5 relative inset-y-0 justify-center items-center group flex flex-col cursor-col-resize transition-colors"
        >
          <span className=" h-full w-px bg-outline-variant transition-colors" />
        </m.span>
      </span>
    </m.aside>
  );
}
