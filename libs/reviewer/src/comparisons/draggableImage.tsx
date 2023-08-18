import NextImage, { StaticImageData } from "next/image";
import { useReviewerStore } from "../store";
import { MotionValue, m, useMotionValueEvent } from "framer-motion";
import {
  useEffect,
  useRef,
  useLayoutEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { DottedBackground } from "@pixeleye/ui";
import { cx } from "class-variance-authority";

interface ImageProps {
  base: {
    src: string | StaticImageData;
    alt: string;
    width: number;
    height: number;
  };
  overlay?: {
    src: string | StaticImageData;
    alt: string;
    width: number;
    height: number;
  };
  x: MotionValue<number>;
  y: MotionValue<number>;
  scale: MotionValue<number>;
  onTap?: () => void;
  className?: string;
}

export type DraggableImageRef = {
  center: () => void;
  getDefaults: () => {
    x: number;
    y: number;
    scale: number;
  };
};

export const DraggableImage = forwardRef<DraggableImageRef, ImageProps>(
  function DraggableImage(
    { base, overlay, x, y, scale, onTap, className },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const draggableRef = useRef<HTMLDivElement>(null);

    const optimize = useReviewerStore((state) => state.optimize);
    const showOverlay = useReviewerStore((state) => state.showDiff);

    const cancelTap = useRef(false);

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

    const getDefaults = useCallback(() => {
      if (!containerRef.current)
        return {
          x: 0,
          y: 8,
          scale: 1,
        };

      const { width, height } = containerRef.current.getBoundingClientRect();

      const { width: baseWidth, height: baseHeight } = base;

      const scale = Math.max(
        Math.min((baseWidth / width) * 2, (height / baseHeight) * 2, 0.95),
        0.25
      );

      return {
        x: 0,
        y: 8,
        scale,
      };
    }, [base]);

    const center = useCallback(() => {
      const { scale: s, x: dX, y: dY } = getDefaults();

      scale.set(s);
      x.set(dX);
      y.set(dY);
    }, [getDefaults, scale, x, y]);

    useEffect(() => {
      center();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(ref, () => ({
      center,
      getDefaults,
    }));

    useMotionValueEvent(scale, "change", (latest) => {
      if (latest === 0) scale.set(getDefaults().scale);
    });

    return (
      <DottedBackground
        className={cx("h-full w-full bg-surface-container-low", className)}
      >
        <m.div
          onMouseEnter={() => {
            mouseOver.current = true;
          }}
          onMouseLeave={() => {
            mouseOver.current = false;
          }}
          onWheel={(e) => {
            flushSync(() => {
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
              } = draggableRef.current!.getBoundingClientRect();

              const dx = e.clientX - containerLeft - width / 2;
              const dy = e.clientY - containerTop;

              const newX = x.get() - dx * (s / prevS - 1);
              const newY = y.get() - dy * (s / prevS - 1);

              scale.jump(s);
              x.set(newX);
              y.jump(newY);
            });
          }}
          onTap={() => !cancelTap.current && onTap?.()}
          onTapStart={() => (cancelTap.current = false)}
          onPan={(_, info) => {
            x.jump(x.get() + info.delta.x);
            y.jump(y.get() + info.delta.y);
            cancelTap.current = true;
          }}
          ref={containerRef}
          className="relative grow-0 w-full h-full overflow-hidden max-h-fit cursor-grab outline-none rounded border border-outline-variant z-0"
        >
          <m.div
            ref={draggableRef}
            suppressHydrationWarning
            style={{
              scale,
              x,
              y,
              aspectRatio: `${base.width} / ${base.height}`,
              transformOrigin: "top center",
            }}
            className="relative z-0 pointer-events-none"
          >
            <NextImage
              key={`double-base-${base.src.toString()}`}
              quality={100}
              priority
              className="pointer-events-none z-0 select-none z-0 absolute inset-0"
              draggable={false}
              alt={base.alt}
              src={base.src}
              fill
              unoptimized={!optimize}
            />
            {overlay && (
              <NextImage
                key={`double-overlay-${overlay.src.toString()}`}
                priority
                quality={100}
                className={cx(
                  !showOverlay && "opacity-0",
                  "pointer-events-none select-none z-10 absolute inset-0 z-10"
                )}
                draggable={false}
                alt={overlay.alt}
                src={overlay.src}
                fill
                unoptimized={!optimize}
              />
            )}
          </m.div>
        </m.div>
      </DottedBackground>
    );
  }
);
