"use client";

import {
  m,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useRef, useLayoutEffect, useState, useEffect } from "react";
import { useGlobalStore } from "../providers";
import Example from "./dash";

function SpotTheDifference() {

  return (
    <>
      <p className="absolute text-tertiary -top-16 xl:left-24 z-10 lg:-left-16 font-bold lg:text-3xl text-2xl">
        Spot the difference
      </p>
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" className="text-tertiary -left-28 lg:h-32 h-28 -top-28 lg:-left-28 -rotate-45 transform absolute lg:-top-32 xl:left-10 z-10" viewBox="-20.5 0 287 287">
        <path fill="currentColor" d="M156.3 265.7c1.6-.3 2.3 0 3-.3 38.5-23.2 64.7-56.2 74.7-100.7a72.5 72.5 0 0 0-.9-34.2 56 56 0 0 0-51.7-43 60 60 0 0 0-37.2 7.9c-.8 6-1.5 12.2-2.7 18a31 31 0 0 1-15.7 21.5c-6.3 3.6-12.6 3.6-16 .2-4.4-4.4-4.4-10.3-1.7-15.2 3.8-6.8 8.5-13.1 13.3-19 3.2-3.8 7.4-7 11.2-10.2-3.6-23.9-26.2-34-53.2-24.1-.9 3.4-1.7 7-2.8 10.4-4.2 12.4-12 22-24.7 26.4-4.8 1.7-10 2.3-14.3-2.1-3.2-3.4-3.2-9.3.2-15.2a66.9 66.9 0 0 1 22.6-21.6c3.2-2 6.3-3.8 9.5-5.5C65.7 22 32.5-4.3 0 10.5c.2-2.7 0-5 .8-6.3C2 2.7 4.2 1.9 6.1 1.4 24.1-2 40.8.2 54.5 13.3a84.7 84.7 0 0 1 22 35c.6 2 1.2 3.9 2 5.8 0 .2.5.4 1.3 1 2-.1 4.2-.1 6.6-.6 28.3-4.4 43 3.2 56.1 29.6 2.6-.8 5.5-1.6 8.3-2.7 16.2-5.5 32.5-6 49-.4a66.8 66.8 0 0 1 46 61.1c1 15.9-1.7 31.1-7.4 46a152.5 152.5 0 0 1-71 82.2l-5.2 3c-.2.2-.5.6-1 1.9 7 1.7 13.8 1 20.6.6 6.5-.2 13.3-.8 20.5-1.3-.7 5.5-3.6 7.7-7.2 9-4.2 1.2-8.4 2.9-12.7 3.1-11.4.4-23 .6-34.6 0-9-.6-11.6-5.5-7.6-13l26.4-46.9c1.5-2.5 3.4-4.6 5.7-7.6 4 4.7 2.3 8 .8 11.2-5.9 11.5-11.1 22.9-16.8 35.4ZM43.8 94.9C58.5 93 67.6 83.7 68.2 70.6c-9.7 6.4-19 12-24.3 24.3Zm71.4 32.8c12.4-3 18.4-11.4 17-24.3-8 6.8-14.9 13.1-17 24.3Z" />
      </svg>
    </>
  )
}

export function Swiper() {
  const container = useRef<HTMLDivElement>(null);

  const [windowWidth, setWindowSize] = useState(0);

  const handleSize = () => {
    setWindowSize(window.innerWidth);
  };

  useLayoutEffect(() => {
    handleSize();

    window.addEventListener("resize", handleSize);

    return () => window.removeEventListener("resize", handleSize);
  }, []);

  const [constraintWidth, setConstraintWidth] = useState(0);

  const constrainer = useRef(null);

  const x = useMotionValue(0);

  const framerLoaded = useGlobalStore((state) => state.framerLoaded);

  useLayoutEffect(() => {
    if (!framerLoaded || !container.current) return;
    const { width, left } = container.current.getBoundingClientRect();

    setConstraintWidth(Math.min(windowWidth - left, width) - 32);
  }, [framerLoaded, windowWidth]);

  const clipped = useTransform(x, (latest) => {
    return latest + 33.5;
  });

  const clipPath = useMotionTemplate`inset(0px  0px 0px ${clipped}px )`;

  useEffect(() => {
    if (!container.current) return;
    const { width, left } = container.current.getBoundingClientRect();
    setConstraintWidth(Math.min(windowWidth - left, width) - 32);
  }, [windowWidth]);

  return (
    <div className="relative z-0">
      <SpotTheDifference />
      <div
        className="relative z-0 mt-24"
        ref={container}
        onClick={({ clientX, currentTarget }) => {
          var { left } = currentTarget.getBoundingClientRect();
          x.set(clientX - left - 32);
        }}
      >
        <div className="h-[45rem] w-[76rem] relative z-0 rounded-md pointer-events-none overflow-hidden bg-surface-container-lowest shadow-2xl ring-1 ring-gray-900/10">
          <Example offset />
        </div>
        <m.div
          className="absolute inset-0 will-change-[clip] z-10"
          style={{ clipPath }}
        >
          <div className="h-[45rem] w-[76rem] relative z-0 rounded-md pointer-events-none overflow-hidden bg-surface-container-lowest shadow-2xl ring-1 ring-gray-900/10">
            <Example />
          </div>
        </m.div>
        <m.div
          ref={constrainer}
          style={{ width: constraintWidth }}
          className="mx-4"
        >
          <m.div
            dragConstraints={constrainer}
            dragMomentum={false}
            dragElastic={0}
            animate={{ x: 75 }}
            style={{ x }}
            drag="x"
            className="absolute inset-y-0 flex flex-col items-center justify-center z-20 cursor-grab"
          >
            <span className="mx-4 h-[calc(30%-1.5rem)] w-1 bg-outline" />
            <span className="h-12 w-6 bg-outline backdrop-blur-[1px] border-4 border-outline rounded-full relative">
              <span className="w-0.5 bg-on-surface absolute inset-y-2 left-[calc(50%-1px)] rounded-full" />
            </span>
            <span className="mx-4 h-[calc(70%-1.5rem)] w-1 bg-outline" />
          </m.div>
        </m.div>
      </div>
    </div>
  );
}
