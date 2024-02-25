"use client";

import { m, useMotionValue, useMotionValueEvent } from "framer-motion";
import { FC, useContext, useEffect, useState } from "react";
import BuildInfoPanel from "./panels/buildInfo";
import SnapshotsPanel from "./panels/snapshots";
import FeedPanel from "./panels/feed";
import { StoreContext } from "./store";
import OverlayScrollbar from "@pixeleye/ui/src/scrollArea/scrollArea";
import { useStore } from "zustand";
import * as Dialog from "@radix-ui/react-dialog";
import { cx } from "class-variance-authority";
import { Sidebar } from "./sidebar";

export type Panel = "snapshots" | "build-info" | "feed";

const panelRepo: Record<Panel, FC> = {
  snapshots: SnapshotsPanel,
  "build-info": BuildInfoPanel,
  feed: FeedPanel,
};


export function PanelMobile() {
  const store = useContext(StoreContext)!

  const panelOpen = useStore(store, (state) => state.panelOpen);
  const setPanelOpen = useStore(store, (state) => state.setPanelOpen);
  const panel = useStore(store, (state) => state.panel);

  const PanelComponent = panelRepo[panel];


  return (
    <Dialog.Root modal={false} open={panelOpen} onOpenChange={(open) => window.innerWidth < 1024 && setPanelOpen(() => open)}>
      <Dialog.Portal>
        <Dialog.Content className={cx("lg:hidden absolute left-0 z-10 top-16 bottom-0 w-full max-w-xs bg-surface-container-low shadow border-r border-b border-outline-variant rounded-r-xl z-10 mt-px top-[calc(4rem-1px)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0")} >
          <div className="flex w-full h-full">
            <Sidebar className="!bg-surface-container-low" />
            <OverlayScrollbar className="flex grow h-full w-full z-10 overflow-y-auto [&>*:nth-child(2)]:flex">
              <PanelComponent />
            </OverlayScrollbar>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root >
  )

}

export function PanelDesktop() {
  const store = useContext(StoreContext)!
  const panel = useStore(store, (state) => state.panel);
  const PanelComponent = panelRepo[panel];

  return (
    <aside className="relative z-10 shrink-0 hidden lg:flex h-full w-full">
      <OverlayScrollbar className="flex grow z-10 overflow-y-auto [&>*:nth-child(2)]:flex w-full">
        <PanelComponent />
      </OverlayScrollbar>
    </aside>
  );
}
