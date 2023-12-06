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
    <div
      className="relative z-0"
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
  );
}
