import { cx } from "class-variance-authority";

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cx("animate-pulse rounded-md bg-muted", className)}
            {...props}
        />
    )
}

export { Skeleton }
