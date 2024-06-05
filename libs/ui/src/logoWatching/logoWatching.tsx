"use client"

import { useEffect, useId, useRef } from "react";
import { m, useMotionValue, useTransform } from "framer-motion"

export interface LogoWatchingProps {
    className?: string;
    height?: number;
    width?: number;
}

export default function LogoWatching(props: LogoWatchingProps) {
    const ref = useRef<SVGPathElement>(null);
    const maskId = useId();

    const x = useMotionValue(-100)
    const y = useMotionValue(-100)

    const translateX = useTransform(x, [-400, 200], [-2, 0])
    const translateY = useTransform(y, [-400, 200], [-2, 2])

    useEffect(
        () => {
            const update = (e: MouseEvent) => {
                const { x: offsetX, y: offsetY } = ref.current?.getBoundingClientRect() || { x: 0, y: 0 }
                x.set(e.pageX - offsetX - 75)
                y.set(e.pageY - offsetY + 25)
            }
            window.addEventListener('mousemove', update)
            return () => {
                window.removeEventListener('mousemove', update)
            }
        },
        [x, y]
    )

    return (
        <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            aria-label="Pixeleye logo"
            {...props}
        >
            <defs>
                <mask id={maskId}>
                    <rect width="24" height="24" fill="#fff" />
                    <m.path ref={ref} style={{
                        translateX, translateY
                    }} d="M12 9A1 1 0 0114.5 9 1 1 0 0112 9" fill="#000" />
                </mask>
            </defs>
            <path
                mask={`url(#${maskId})`}
                d="M2 22V15Q2 2 15 2L14 5.5Q5.5 5.5 5.5 15V22ZM22 2Q22 17 9 17L10 13.5Q18.5 13.5 18.5 2ZM9.5 9.5A1 1 0 0014.5 9.5 1 1 0 009.5 9.5"
                fill="currentColor"
            />
        </svg>
    );
}