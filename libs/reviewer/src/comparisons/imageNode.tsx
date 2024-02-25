import { cx } from "class-variance-authority";
import { StaticImageData } from "next/image";
import { useContext } from "react";
import { NodeProps } from "reactflow";
import { useStore } from "zustand";
import { StoreContext } from "../store";
import NextImage from "next/image";

export interface ImageNodeData {
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
    secondBase?: {
        src: string | StaticImageData;
        alt: string;
        width: number;
        height: number;
    };
}

export function ImageNode({ data: {
    base,
    overlay,
    secondBase
} }: NodeProps<ImageNodeData>) {

    const store = useContext(StoreContext)!

    const optimize = useStore(store, (state) => state.optimize);
    const showOverlay = useStore(store, (state) => state.showDiff);
    const singleSnapshot = useStore(store, (state) => state.singleSnapshot);


    return (
        <div className="active:cursor-grabbing">
            <NextImage
                key={`base - ${base.src.toString()}`}
                quality={100}
                priority
                width={base.width}
                height={base.height}
                className={cx(
                    "pointer-events-none select-none",
                    singleSnapshot !== "head" && "hidden",
                    showOverlay && overlay && "brightness-[50%]"
                )}
                draggable={false}
                alt={base.alt}
                src={base.src}
                unoptimized={!optimize}
                placeholder={optimize ? "blur" : "empty"}
            />
            {secondBase && (
                <NextImage
                    key={`second - base - ${secondBase.src.toString()}`}
                    quality={100}
                    priority
                    className={cx(
                        "pointer-events-none select-none",
                        singleSnapshot === "head" && "hidden",
                    )}
                    width={secondBase.width}
                    height={secondBase.height}
                    draggable={false}
                    alt={secondBase.alt}
                    src={secondBase.src}
                    placeholder={optimize ? "blur" : "empty"}
                    unoptimized={!optimize}
                />
            )}
            {overlay && (
                <NextImage
                    key={`overlay - ${overlay.src.toString()}`}
                    priority
                    quality={100}
                    className={cx(
                        (!showOverlay || singleSnapshot !== "head") && "opacity-0",
                        "pointer-events-none select-none absolute inset-0",
                    )}
                    width={overlay.width}
                    height={overlay.height}
                    draggable={false}
                    alt={overlay.alt}
                    src={overlay.src}
                    placeholder={optimize ? "blur" : "empty"}
                    unoptimized={!optimize}
                />
            )}
        </div>

    )
}