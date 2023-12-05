"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@pixeleye/ui";
import {
  InformationCircleIcon,
  QueueListIcon,
  ChatBubbleBottomCenterTextIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
} from "@heroicons/react/24/solid";
import {
  InformationCircleIcon as InformationCircleOutlineIcon,
  QueueListIcon as QueueListOutlineIcon,
  ChatBubbleBottomCenterTextIcon as ChatBubbleBottomCenterTextOutlineIcon,
} from "@heroicons/react/24/outline";
import { Panel } from "./panel";
import { cx } from "class-variance-authority";
import { useContext } from "react";
import { useStore } from "zustand";
import { store, StoreContext } from "./store";

interface SidebarItem {
  name: string;
  IconActive: typeof InformationCircleIcon;
  Icon: typeof InformationCircleIcon;
  id: Panel;
}

const SidebarNav: SidebarItem[] = [
  {
    name: "Snapshots",
    IconActive: QueueListIcon,
    Icon: QueueListOutlineIcon,
    id: "snapshots",
  },
  {
    name: "Build info",
    IconActive: InformationCircleIcon,
    Icon: InformationCircleOutlineIcon,
    id: "build-info",
  },
  // {
  //   name: "Feed",
  //   IconActive: ChatBubbleBottomCenterTextIcon,
  //   Icon: ChatBubbleBottomCenterTextOutlineIcon,
  //   id: "feed",
  // },
];

function BatchApprove() {
  const buildAPI = useStore(store, (state) => state.buildAPI);

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="sr-only">Batch actions</span>
                <svg
                  viewBox="3.511 18.9804 486.131 481.0199"
                  className="h-7 w-7"
                  fill="currentColor"
                >
                  <path
                    d="M 224.264 140.362 C 238.412 133.811 254.743 133.811 268.889 140.362 L 476.444 236.258 C 484.515 239.961 489.642 248.033 489.642 256.958 C 489.642 265.883 484.515 273.953 476.444 277.656 L 268.889 373.553 C 254.743 380.104 238.412 380.104 224.264 373.553 L 16.707 277.656 C 8.638 273.858 3.511 265.788 3.511 256.958 C 3.511 248.127 8.638 239.961 16.707 236.258 L 224.264 140.362 Z M 425.932 334.436 L 476.444 357.792 C 484.515 361.496 489.642 369.565 489.642 378.49 C 489.642 387.415 484.515 395.487 476.444 399.189 L 268.889 495.087 C 254.743 501.638 238.412 501.638 224.264 495.087 L 16.707 399.189 C 8.638 395.392 3.511 387.321 3.511 378.49 C 3.511 369.661 8.638 361.496 16.707 357.792 L 67.221 334.436 L 211.54 401.088 C 233.759 411.342 259.395 411.342 281.614 401.088 L 425.932 334.436 Z"
                    transform="matrix(1, 0, 0, 1, -2.2737367544323206e-13, -2.2737367544323206e-13)"
                  />
                  <g transform="matrix(1.060338020324707, 0, 0, 1.060338020324707, 238.9242248535154, 146.52809143066384)">
                    <path
                      d="M 123.747 -119.863 C 135.557 -117.5 143.234 -106.008 140.873 -94.198 L 139.828 -89.02 C 137.42 -76.891 132.968 -65.355 126.745 -54.861 L 192.156 -54.861 C 204.193 -54.861 213.959 -45.095 213.959 -33.058 C 213.959 -24.654 209.19 -17.341 202.194 -13.707 C 207.146 -9.71 210.325 -3.577 210.325 3.281 C 210.325 13.91 202.694 22.768 192.656 24.676 C 194.653 27.991 195.79 31.853 195.79 35.986 C 195.79 45.662 189.475 53.883 180.754 56.699 C 181.072 58.199 181.254 59.788 181.254 61.424 C 181.254 73.461 171.488 83.227 159.451 83.227 L 115.162 83.227 C 106.532 83.227 98.128 80.683 90.951 75.914 L 73.463 64.24 C 61.336 56.154 54.067 42.528 54.067 27.946 L 54.067 10.548 L 54.067 -11.255 L 54.067 -22.565 C 54.067 -35.829 60.109 -48.32 70.42 -56.632 L 73.782 -59.313 C 85.818 -68.943 94.04 -82.479 97.038 -97.559 L 98.083 -102.738 C 100.445 -114.548 111.937 -122.224 123.747 -119.863 Z M -4.075 -47.594 L 24.997 -47.594 C 33.036 -47.594 39.532 -41.098 39.532 -33.058 L 39.532 68.692 C 39.532 76.731 33.036 83.227 24.997 83.227 L -4.075 83.227 C -12.115 83.227 -18.61 76.731 -18.61 68.692 L -18.61 -33.058 C -18.61 -41.098 -12.115 -47.594 -4.075 -47.594 Z"
                      strokeWidth="40"
                      paintOrder="stroke"
                      stroke="rgb(var(--color-surface))"
                    />
                    <path
                      d="M -50.711 -47.334 C -38.901 -44.971 -31.224 -33.479 -33.585 -21.669 L -34.63 -16.491 C -37.038 -4.362 -41.49 7.174 -47.713 17.668 L 17.698 17.668 C 29.735 17.668 39.501 27.434 39.501 39.471 C 39.501 47.875 34.732 55.188 27.736 58.822 C 32.688 62.819 35.867 68.952 35.867 75.81 C 35.867 86.439 28.236 95.297 18.198 97.205 C 20.195 100.52 21.332 104.382 21.332 108.515 C 21.332 118.191 15.017 126.412 6.296 129.228 C 6.614 130.728 6.796 132.317 6.796 133.953 C 6.796 145.99 -2.97 155.756 -15.007 155.756 L -59.296 155.756 C -67.926 155.756 -76.33 153.212 -83.507 148.443 L -100.995 136.769 C -113.122 128.683 -120.391 115.057 -120.391 100.475 L -120.391 83.077 L -120.391 61.274 L -120.391 49.964 C -120.391 36.7 -114.349 24.209 -104.038 15.897 L -100.676 13.216 C -88.64 3.586 -80.418 -9.95 -77.42 -25.03 L -76.375 -30.209 C -74.013 -42.019 -62.521 -49.695 -50.711 -47.334 Z M -178.533 24.935 L -149.461 24.935 C -141.422 24.935 -134.926 31.431 -134.926 39.471 L -134.926 141.221 C -134.926 149.26 -141.422 155.756 -149.461 155.756 L -178.533 155.756 C -186.573 155.756 -193.068 149.26 -193.068 141.221 L -193.068 39.471 C -193.068 31.431 -186.573 24.935 -178.533 24.935 Z"
                      transform="matrix(-1, 0, 0, -1, 0.000006, 0)"
                      strokeWidth="40"
                      paintOrder="stroke"
                      style={{
                        transformOrigin: "50% 50%",
                        transformBox: "fill-box",
                      }}
                      stroke="rgb(var(--color-surface))"
                    />
                  </g>
                </svg>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Batch actions</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuPortal>
        <DropdownMenuContent side="right">
          <DropdownMenuLabel>Remaining snaps</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => buildAPI.approveRemainingSnapshots()}
          >
            <HandThumbUpIcon className="h-6 w-6 text-on-surface-variant mr-2" />
            Approve remaining
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => buildAPI.rejectRemainingSnapshots()}>
            <HandThumbDownIcon className="h-6 w-6 text-on-surface-variant mr-2" />
            Reject remaining
          </DropdownMenuItem>
          <DropdownMenuLabel>All snaps</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => buildAPI.approveAllSnapshots()}
          >
            <HandThumbUpIcon className="h-6 w-6 text-on-surface-variant mr-2" />
            Approve all
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => buildAPI.rejectAllSnapshots()}>
            <HandThumbDownIcon className="h-6 w-6 text-on-surface-variant mr-2" />
            Reject all
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

export function Sidebar() {
  const store = useContext(StoreContext)

  const setPanel = useStore(store, (state) => state.setPanel);
  const panel = useStore(store, (state) => state.panel);
  const optimize = useStore(store, (state) => state.optimize);

  const setPanelOpen = useStore(store, (state) => state.setPanelOpen);

  return (
    <div className={cx("w-16 border-r  border-outline-variant flex-col flex items-center pt-2 shrink-0", optimize? "bg-surface" : "bg-surface-container-lowest" )}>
      <nav>
        <ul role="list" className="space-y-2">
          {SidebarNav.map((item) => (
            <li key={item.id}>
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => {
                        if (panel === item.id) setPanelOpen((state) => !state);
                        else {
                          setPanel(item.id);
                          setPanelOpen(() => true);
                        }
                      }}
                      variant="ghost"
                      className={cx(
                        "hover:text-on-surface",
                        panel === item.id
                          ? "text-on-surface"
                          : "text-on-surface-variant"
                      )}
                    >
                      <span className="sr-only">{item.name}</span>
                      {panel === item.id ? (
                        <item.IconActive className="h-7 w-7 " />
                      ) : (
                        <item.Icon className="h-7 w-7 " />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </li>
          ))}
        </ul>
        <hr className="text-outline-variant mx-4 my-4" />
        <ul role="list" className="space-y-2">
          <li>
            <BatchApprove />
          </li>
        </ul>
      </nav>
    </div>
  );
}
