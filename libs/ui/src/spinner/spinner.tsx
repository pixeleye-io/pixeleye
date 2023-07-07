import { DetailedHTMLProps, HTMLAttributes } from "react";

export interface SpinnerProps
  extends Omit<
    DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>,
    "role" | "aria-valuemin" | "aria-valuemax"
  > {
  /**
   * Controls if the spinner should be visible.
   * Will remove from dom when hidden
   */
  loading?: boolean;
}

/**
 * Spinner component
 * used to indicated loading
 * Color and font-size are inherited
 */
export default function Spinner({ loading, ...rest }: SpinnerProps) {
  return loading ? (
    <span
      role="progressbar"
      aria-label="loading"
      {...rest}
      aria-valuemin={0}
      aria-valuemax={1}
    >
      <svg
        className="progress-circular animate-spin"
        viewBox="22 22 44 44"
        stroke="currentColor"
        height="1em"
        width="1em"
      >
        <circle cx="44" cy="44" r="20.2" fill="none" strokeWidth="3.6" />
      </svg>
    </span>
  ) : null;
}
