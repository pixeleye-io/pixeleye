/* eslint-disable @next/next/no-img-element */
import { cx } from "class-variance-authority";
// import { StaticImageData } from "next/image";
import { useContext } from "react";
import { NodeProps } from "reactflow";
import { useStore } from "zustand";
import { StoreContext } from "../store";
// import NextImage from "next/image";

export interface ImageNodeData {
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
    secondBase?: {
        src: string;
        alt: string;
        width: number;
        height: number;
    };
}

export function ImageNode({ data: {
    base,
    overlay,
    secondBase,
} }: NodeProps<ImageNodeData>) {

    const store = useContext(StoreContext)!

    const type = Boolean(secondBase) ? "single" : "double";

    const optimize = useStore(store, (state) => state.optimize);
    const showOverlay = useStore(store, (state) => state.showDiff);
    const singleSnapshot = useStore(store, (state) => state.singleSnapshot);

    const singleStyle = singleSnapshot === "head" ? {
        width: base.width,
        height: base.height
    } : {
        width: secondBase?.width,
        height: secondBase?.height
    }

    const doubleStyle = {
        width: base.width,
        height: base.height
    }



    return (
        <div className="active:cursor-grabbing relative" style={type === "double" ? doubleStyle : singleStyle}>
            <img
                key={`base - ${base.src.toString()}`}
                className={cx(
                    "pointer-events-none select-none absolute inset-0",
                    singleSnapshot !== "head" && type === "single" && "hidden",
                    showOverlay && overlay && "brightness-[50%]",
                )}
                sizes="(min-width: 640px) 50vw, 100vw"
                draggable={false}
                alt={base.alt}
                src={base.src}
            />
            {secondBase && (
                <img
                    key={`second - base - ${secondBase.src.toString()}`}
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className={cx(
                        "pointer-events-none select-none absolute inset-0",
                        singleSnapshot === "head" && type === "single" && "hidden",
                    )}
                    draggable={false}
                    alt={secondBase.alt}
                    src={secondBase.src}
                />
            )}
            {overlay && (
                <img
                    key={`overlay - ${overlay.src.toString()}`}
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className={cx(
                        (!showOverlay || (singleSnapshot !== "head" && type === "single")) && "opacity-0",
                        "pointer-events-none select-none absolute inset-0",
                    )}
                    draggable={false}
                    alt={overlay.alt}
                    src={overlay.src}
                />
            )}
        </div>

    )
}