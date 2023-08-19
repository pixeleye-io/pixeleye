import NextImage, { StaticImageData } from "next/image";
import { useReviewerStore } from "../store";
import { MotionValue, m, useMotionValueEvent } from "framer-motion";
import {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { DottedBackground } from "@pixeleye/ui";
import { cx } from "class-variance-authority";
import {
  createUseGesture,
  dragAction,
  pinchAction,
  wheelAction,
} from "@use-gesture/react";

interface ImageProps {
  base: {
    src: string | StaticImageData;
    alt: string;
    width: number;
    height: number;
  };
  secondBase?: {
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
  showSecondBase?: boolean;
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
    {
      base,
      overlay,
      x,
      y,
      scale,
      onTap,
      className,
      secondBase,
      showSecondBase = false,
    },
    ref
  ) {
    const parentRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const draggableRef = useRef<HTMLDivElement>(null);

    const optimize = useReviewerStore((state) => state.optimize);
    const showOverlay = useReviewerStore((state) => state.showDiff);

    const cancelTap = useRef(false);

    const getDefaults = useCallback(() => {
      if (!parentRef.current)
        return {
          x: 0,
          y: 8,
          scale: 1,
        };

      const { width, height } = parentRef.current.getBoundingClientRect();

      const { width: baseWidth, height: baseHeight } = base;

      const aspect = width / baseWidth;

      const adjustedHeight = baseHeight * aspect;
      const adjustedWidth = baseWidth * aspect;

      const scale = Math.max(
        Math.min(
          (width - 16) / adjustedWidth,
          (height - 16) / adjustedHeight,
          10
        ),
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

    useImperativeHandle(ref, () => ({
      center,
      getDefaults,
    }));

    const zoom = useCallback(
      (
        event: {
          clientX: number;
          clientY: number;
        },
        delta: number
      ) => {
        const prevS = scale.get();
        const s = Math.max(0.1, prevS - delta);

        const {
          left: containerLeft,
          top: containerTop,
          width,
        } = draggableRef.current!.getBoundingClientRect();

        const dx = event.clientX - containerLeft - width / 2;
        const dy = event.clientY - containerTop;

        const newX = x.get() - dx * (s / prevS - 1);
        const newY = y.get() - dy * (s / prevS - 1);

        scale.set(s);
        x.set(newX);
        y.set(newY);
      },
      [scale, x, y]
    );

    const useGesture = createUseGesture([dragAction, wheelAction, pinchAction]);

    useGesture(
      {
        onDrag: ({ delta: [dx, dy], pinching, tap }) => {
          if (pinching) return;

          if (tap && onTap && !cancelTap.current) {
            return onTap();
          }

          x.set(dx + x.get());
          y.set(dy + y.get());
        },
        onDragEnd: () => (cancelTap.current = false),
        onWheel: ({
          event,
          delta: [dX, dY],
          pinching,
          ctrlKey,
          altKey,
          shiftKey,
        }) => {
          if (pinching) return;

          event.preventDefault();
          cancelTap.current = true;

          if (altKey || shiftKey || ctrlKey) {
            x.set(x.get() - dX);
            y.set(y.get() - dY);
            return;
          }

          zoom(event, dY / 1000);
        },
        onPinch: ({ event, delta: [d], origin: [oX, oY], wheeling }) => {
          event.preventDefault();
          cancelTap.current = true;

          zoom(
            {
              clientX: oX,
              clientY: oY,
            },
            -d
          );
        },
      },
      { target: containerRef, wheel: { eventOptions: { passive: false } } }
    );

    useEffect(() => {
      center();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Framer motion is lazy loading the image, so we need to re-center it once it's loaded
    useMotionValueEvent(scale, "change", (latest) => {
      if (latest === 0) scale.set(getDefaults().scale);
    });

    return (
      <DottedBackground
        ref={parentRef}
        className={cx(
          "h-full w-full bg-surface-container-low rounded border border-outline-variant overflow-hidden",
          className
        )}
      >
        <div
          ref={containerRef}
          className="grow-0 w-full h-full cursor-grab z-0 select-non touch-none	active:cursor-grabbing"
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
              key={`base-${base.src.toString()}`}
              quality={100}
              priority
              className={cx(
                "pointer-events-none z-0 select-none z-0 absolute inset-0",
                showSecondBase && "opacity-0",
                showOverlay && overlay && "brightness-75"
              )}
              draggable={false}
              alt={base.alt}
              src={base.src}
              fill
              unoptimized={!optimize}
            />
            {secondBase && (
              <NextImage
                key={`second-base-${secondBase.src.toString()}`}
                quality={100}
                priority
                className={cx(
                  "pointer-events-none z-0 select-none z-0 absolute inset-0 ",
                  !showSecondBase && "opacity-0"
                )}
                draggable={false}
                alt={secondBase.alt}
                src={secondBase.src}
                fill
                unoptimized={!optimize}
              />
            )}
            {overlay && (
              <NextImage
                key={`overlay-${overlay.src.toString()}`}
                priority
                quality={100}
                className={cx(
                  (!showOverlay || showSecondBase) && "opacity-0",
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
        </div>
      </DottedBackground>
    );
  }
);
