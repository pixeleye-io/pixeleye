"use client";

import {
  m,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useWindowSize } from "usehooks-ts";
import { useRef, useLayoutEffect, useState, useEffect } from "react";
import { useGlobalStore } from "./providers";

export interface SwiperProps {}

export function Swiper(props: SwiperProps) {
  const container = useRef<HTMLDivElement>(null);

  const size = useWindowSize();
  const [constraintWidth, setConstraintWidth] = useState(0);

  const constrainer = useRef(null);

  const x = useMotionValue(0);

  const framerLoaded = useGlobalStore((state) => state.framerLoaded);

  useLayoutEffect(() => {
    if (!framerLoaded || !container.current) return;
    const { width, left } = container.current.getBoundingClientRect();
    setConstraintWidth(Math.min(size.width - left, width) );
  }, [framerLoaded]);

  const clipped = useTransform(x, (latest) => {
    return latest + 4;
  });

  const clipPath = useMotionTemplate`inset(0px  0px 0px ${clipped}px )`;

  useLayoutEffect(() => {
    if (!container.current) return;
    const { width, left } = container.current.getBoundingClientRect();
    setConstraintWidth(Math.min(size.width - left, width) );
  }, [size.width]);

  return (
    <div className="relative z-0" ref={container}>
      <img
        src="https://tailwindui.com/img/component-images/project-app-screenshot.png"
        alt="App screenshot"
        width={2432}
        height={1442}
        className="w-[76rem] z-0 pointer-events-none select-none rounded-md shadow-2xl ring-1 ring-gray-900/10"
      />
      <m.div
        className="absolute inset-0 will-change-[clip] z-10"
        style={{ clipPath }}
      >
        <img
          src="https://tailwindui.com/img/component-images/dark-project-app-screenshot.png"
          alt="App screenshot"
          width={2432}
          height={1442}
          className="w-[76rem] pointer-events-none select-none 0 overflow-hidden rounded-md bg-white/5 shadow-2xl ring-1 ring-white/10"
        />
      </m.div>
      <m.div
        ref={constrainer}
        animate={{ width: constraintWidth }}
        style={{ width: constraintWidth }}
        className=""
      >
        <m.div
          dragConstraints={constrainer}
          dragMomentum={false}
          dragElastic={0}
          animate={{ x: 150 }}
          style={{ x }}
          drag="x"
          className="absolute inset-y-0 flex items-center justify-center z-20 cursor-grab"
        >
          <div className="mx-2 h-full w-px bg-black ">
            <div className="" />
          </div>
        </m.div>
      </m.div>
    </div>
  );
}
