import { cx } from "class-variance-authority";

export type StatusType = "PENDING" | "COMPLETED" | "FAILED" | "UNREVIEWED";

export interface StatusProps {
  status: StatusType;
  size?: "sm" | "md" | "lg";
}

const StatusColors = {
  PENDING: "bg-blue-500",
  COMPLETED: "bg-green-500",
  FAILED: "bg-red-500",
  UNREVIEWED: "bg-yellow-500",
};

const StatusSizes = {
  sm: "w-2 h-2",
  md: "w-4 h-4",
  lg: "w-6 h-6",
};

export default function Status({ status, size = "sm" }: StatusProps) {
  return (
    <span
      className={cx(
        "relative flex items-center justify-center",
        StatusSizes[size],
      )}
    >
      {status === "PENDING" && (
        <span
          className={cx(
            "animate-ping absolute inline-flex h-3/4 w-3/4 rounded-full opacity-75",
            StatusColors[status],
          )}
        />
      )}

      <span
        className={cx(
          "relative inline-flex rounded-full",
          StatusSizes[size],
          StatusColors[status],
        )}
      ></span>
    </span>
  );
}
