import NextImage from "next/image";
import { useReviewerStore } from "../store";
import { MotionValue, m } from "framer-motion";
import { useEffect, useRef } from "react";

interface ImageProps {
  base: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  overlay?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  x: MotionValue<number>;
  y: MotionValue<number>;
  scale: MotionValue<number>;
}

export function DraggableImage({
  base,
  overlay,
  x,
  y,
  scale,
}: ImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<HTMLDivElement>(null);

  const optimize = useReviewerStore((state) => state.optimize);
  const showOverlay = useReviewerStore((state) => state.showDiff);

  const mouseOver = useRef(false);

  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (mouseOver.current && !e.ctrlKey) e.preventDefault();
    };

    window.addEventListener("wheel", handler, {
      passive: false,
    });

    return () => {
      window.removeEventListener("wheel", handler);
    };
  }, [scale]);

  return (
    <m.div
      onMouseEnter={() => {
        mouseOver.current = true;
      }}
      onMouseLeave={() => {
        mouseOver.current = false;
      }}
      onWheel={(e) => {
        if (e.altKey || e.shiftKey) {
          // Allows users to quickly pan around the image
          x.jump(x.get() - e.deltaX);
          y.jump(y.get() - e.deltaY);
          return;
        }
        const prevS = scale.get();
        const s = Math.min(10, Math.max(prevS - e.deltaY / 1000, 0.1));

        const {
          left: containerLeft,
          top: containerTop,
          width,
          height,
        } = draggableRef.current!.getBoundingClientRect();

        const mouseLeft = e.clientX - containerLeft;
        const mouseTop = e.clientY - containerTop;

        const dx = mouseLeft - width / 2;
        const dy = mouseTop - height / 2;

        const newX = x.get() - dx * (s / prevS - 1);
        const newY = y.get() - dy * (s / prevS - 1);

        scale.jump(s);
        x.jump(newX);
        y.jump(newY);
      }}
      onPan={(_, info) => {
        x.jump(x.get() + info.delta.x);
        y.jump(y.get() + info.delta.y);
      }}
      ref={containerRef}
      className="relative grow-0 w-full h-full overflow-hidden max-h-fit cursor-grab outline-none bg-surface-container-low rounded border border-outline-variant z-0"
    >
      <m.div
        ref={draggableRef}
        style={{
          scale,
          x,
          y,
          aspectRatio: `${base.width} / ${base.height}`,
        }}
        className="relative z-0 pointer-events-none"
      >
        <NextImage
          className="pointer-events-none z-0 select-none z-0 absolute inset-0"
          draggable={false}
          alt={base.alt}
          src={base.src}
          fill
          unoptimized={!optimize}
        />
        {overlay && showOverlay && (
          <NextImage
            className="pointer-events-none select-none z-10 absolute inset-0 z-10"
            draggable={false}
            alt={overlay.alt}
            src={overlay.src}
            fill
            unoptimized={!optimize}
          />
        )}
      </m.div>
    </m.div>
  );
}
