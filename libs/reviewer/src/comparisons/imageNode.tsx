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
            <NextImage
                key={`base - ${base.src.toString()}`}
                quality={optimize ? 75 : 100}
                fill
                priority
                className={cx(
                    "pointer-events-none select-none",
                    singleSnapshot !== "head" && type === "single" && "hidden",
                    showOverlay && overlay && "brightness-[50%]",
                )}
                sizes="(min-width: 640px) 50vw, 100vw"
                draggable={false}
                alt={base.alt}
                src={base.src}
                unoptimized={!optimize}
                placeholder={optimize ? "blur" : "empty"}
            />
            {secondBase && (
                <NextImage
                    key={`second - base - ${secondBase.src.toString()}`}
                    quality={optimize ? 75 : 100}
                    priority
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className={cx(
                        "pointer-events-none select-none",
                        singleSnapshot === "head" && type === "single" && "hidden",
                    )}
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
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    quality={optimize ? 75 : 100}
                    className={cx(
                        (!showOverlay || (singleSnapshot !== "head" && type === "single")) && "opacity-0",
                        "pointer-events-none select-none",
                    )}
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