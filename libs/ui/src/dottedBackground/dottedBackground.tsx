import { cx } from "class-variance-authority";
import { DetailedHTMLProps, forwardRef } from "react";
import { HTMLAttributes, useId } from "react";

export interface DottedBackgroundProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  svgClasses?: string;
}

/**
 * Adds a dotted background to the parent element
 */
const DottedBackground = forwardRef<HTMLDivElement, DottedBackgroundProps>(
  function DottedBackground(
    { className, svgClasses, children, ...props },
    ref
  ) {
    const id = useId();
    return (
      <div ref={ref} className={cx("relative z-0", className)} {...props}>
        <svg
          className={cx(
            "absolute w-full h-full text-outline-variant/75 -z-10",
            svgClasses
          )}
        >
          <pattern
            id={`${id}-pattern-circles`}
            x="0"
            y="0"
            width="50"
            height="26"
            patternUnits="userSpaceOnUse"
            patternContentUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="currentColor" />
            <circle cx="26" cy="14" r="1" fill="currentColor" />
          </pattern>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#${id}-pattern-circles)`}
          />
        </svg>
        {children}
      </div>
    );
  }
);

export default DottedBackground;
