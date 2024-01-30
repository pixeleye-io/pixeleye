import Link from "next/link"
import { ReactNode } from "react"



function AnchorIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
    return (
        <svg
            viewBox="0 0 20 20"
            fill="none"
            strokeLinecap="round"
            aria-hidden="true"
            {...props}
        >
            <path d="m6.5 11.5-.964-.964a3.535 3.535 0 1 1 5-5l.964.964m2 2 .964.964a3.536 3.536 0 0 1-5 5L8.5 13.5m0-5 3 3" />
        </svg>
    )
}


function Anchor({
    id,
    children,
}: {
    id: string
    children: React.ReactNode
}) {
    return (
        <Link
            href={`#${id}`}
            className="group text-inherit no-underline hover:text-inherit not-prose"
        >
            <div className="absolute ml-[calc(-1*var(--width)+0.5rem)] mt-1 hidden w-[var(--width)] opacity-0 transition [--width:calc(2.625rem+0.5px+50%-min(50%,calc(theme(maxWidth.lg)+theme(spacing.8))))] group-hover:opacity-100 md:block lg:z-10 2xl:[--width:theme(spacing.10)]">
                <div className="group/anchor block h-5 w-5 rounded-lg ring-1 ring-inset bg-surface-container-high ring-outline hover:bg-surface-container-highest">
                    <AnchorIcon className="h-5 w-5 stroke-on-surface-variant transition group-hover/anchor:stroke-on-surface" />
                </div>
            </div>
            {children}
        </Link>
    )
}

export function HeadingComponent<Level extends 2 | 3>({
    children,
    tag,
    label,
    level,
    anchor = true,
    ...props
}: React.ComponentPropsWithoutRef<`h${Level}`> & {
    id: string
    tag?: string
    label?: string
    level?: Level
    anchor?: boolean
}) {
    level = level ?? (2 as Level)
    let Component = `h${level}` as 'h2' | 'h3'

    return (
        <>
            <Component
                className={tag || label ? 'mt-2 scroll-mt-32' : 'scroll-mt-32'}
                {...props}
            >
                {anchor ? (
                    <Anchor id={props.id}>
                        {children}
                    </Anchor>
                ) : children}

            </Component >
        </>
    )
}