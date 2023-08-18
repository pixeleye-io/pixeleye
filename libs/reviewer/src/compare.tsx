import {
  Button,
  Header,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toggle,
} from "@pixeleye/ui";
import { useReviewerStore } from "./store";
import { useCallback, useEffect, useState } from "react";
import { ArrowsPointingInIcon, EyeIcon } from "@heroicons/react/24/outline";
import { Double, Single } from "./comparisons";
import { SnapshotPair } from "@pixeleye/api";
import { useMotionValue } from "framer-motion";

function TabSwitcher() {
  return (
    <TabsList>
      <TabsTrigger value="double">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          className="w-5 h-5"
          viewBox="0 0 48 48"
        >
          <path
            stroke="currentColor"
            stroke-width="4"
            d="M41 4H7a3 3 0 0 0-3 3v34a3 3 0 0 0 3 3h34a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Z"
          />
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-width="4"
            d="M24 4v40"
          />
        </svg>
      </TabsTrigger>
      <TabsTrigger value="single">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          className="w-5 h-5"
          viewBox="0 0 48 48"
        >
          <path
            stroke="currentColor"
            stroke-width="4"
            d="M41 4H7a3 3 0 0 0-3 3v34a3 3 0 0 0 3 3h34a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Z"
          />
        </svg>
      </TabsTrigger>
    </TabsList>
  );
}

interface DisplayOptionsProps {
  resetAlignment: () => void;
}
function DisplayOptions({ resetAlignment }: DisplayOptionsProps) {
  const setShowDiff = useReviewerStore((state) => state.setShowDiff);
  const showDiff = useReviewerStore((state) => state.showDiff);

  return (
    <div className="flex">
      <Toggle pressed={showDiff} onPressedChange={setShowDiff}>
        <EyeIcon className="w-6 h-6" />
      </Toggle>
      <Button variant="ghost" size="icon" onClick={() => resetAlignment()}>
        <ArrowsPointingInIcon className="w-6 h-6" />
      </Button>
    </div>
  );
}

function Title({ snapshot }: { snapshot: SnapshotPair }) {
  return (
    <h2 className="first-letter:uppercase text-on-surface text-xl cursor-text font-bold">
      {snapshot.name}

      {snapshot.variant && (
        <>
          <span className="px-1 text-on-surface-variant" aria-hidden="true">
            /
          </span>
          <span className="text-on-surface-variant">
            <span className="sr-only">variant</span>
            {snapshot.variant}
          </span>
        </>
      )}
      {snapshot.viewport && (
        <>
          <span className="text-on-surface-variant mx-1" aria-hidden="true">
            ·
          </span>
          <span className="text-on-surface-variant text-sm font-normal">
            <span className="sr-only">viewport</span>
            {snapshot.viewport}
          </span>
        </>
      )}
    </h2>
  );
}

export function Compare() {
  const snapshot = useReviewerStore((state) => state.currentSnapshot);

  const [activeTab, setActiveTab] = useState<string>("double");

  const scaleSingle = useMotionValue(1);
  const xSingle = useMotionValue(0);
  const ySingle = useMotionValue(0);

  const scaleDouble = useMotionValue(1);
  const xDouble = useMotionValue(0);
  const yDouble = useMotionValue(0);

  const resetAlignment = useCallback(() => {
    scaleSingle.set(1);
    xSingle.set(0);
    ySingle.set(0);
    scaleDouble.set(1);
    xDouble.set(0);
    yDouble.set(0);
  }, [scaleSingle, xSingle, ySingle, scaleDouble, xDouble, yDouble]);

  useEffect(() => {
    resetAlignment();
  }, [resetAlignment, snapshot]);

  if (!snapshot) {
    return null;
  }

  return (
    <main className="w-full ml-1 z-0 h-full grow-0 flex relative">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        defaultValue="double"
        className=" w-full h-full grow-0 relative max-h-full"
      >
        <header className="w-full border-b border-outline-variant">
          <div className="flex px-4 justify-between py-2">
            <div className="flex flex-col">
              <Title snapshot={snapshot} />
              <div className="mt-4 flex space-x-4">
                <TabSwitcher />
                <DisplayOptions resetAlignment={resetAlignment} />
              </div>
            </div>

            <div className="">
              <Button variant="ghost" className="text-error">
                Reject
              </Button>
              <Button
                variant="ghost"
                className="text-green-500 dark:text-green-300 dark:hover:text-on-surface"
              >
                Approve
              </Button>
            </div>
          </div>
        </header>
        <div className="p-4 w-full h-[calc(100%-6.25rem-1px)]">
          <TabsContent className="w-full h-full !mt-0 grow-0" value="single">
            <Single x={xSingle} y={ySingle} scale={scaleSingle} />
          </TabsContent>
          <TabsContent className="w-full h-full !mt-0 grow-0" value="double">
            <Double x={xDouble} y={yDouble} scale={scaleDouble} />
          </TabsContent>
        </div>
      </Tabs>
    </main>
  );
}
