import { Build, Snapshot } from "@pixeleye/api";
import { cx } from "class-variance-authority";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../tooltip";

export type StatusType = Build["status"]

export type SnapshotStatusType = Snapshot["status"]

export interface StatusProps {
  status: StatusType | SnapshotStatusType;
  size?: "sm" | "md" | "lg";
  snapshotStatus?: boolean;
}

const StatusColors: Record<StatusType, string> = {
  "queued-processing": "bg-blue-500",
  "queued-uploading": "bg-blue-500",
  "uploading": "bg-blue-500",
  "processing": "bg-blue-500",
  "aborted": "bg-red-500",
  "failed": "bg-red-500",
  approved: "bg-green-500",
  rejected: "bg-orange-500",
  unreviewed: "bg-yellow-500",
  unchanged: "bg-teal-500",
  orphaned: "dark:bg-white bg-black",
};

const SnapshotColors: Record<SnapshotStatusType, string> = {
  aborted: "bg-red-500",
  failed: "bg-red-500",
  approved: "bg-green-500",
  rejected: "bg-orange-500",
  unreviewed: "bg-yellow-500",
  orphaned: "dark:bg-white bg-black",
  unchanged: "bg-teal-500",
  processing: "bg-blue-500",
  missing_baseline: "bg-blue-500",
}


const StatusSizes = {
  sm: "w-2 h-2",
  md: "w-4 h-4",
  lg: "w-6 h-6",
};

export default function Status({ status, size = "sm", snapshotStatus }: StatusProps) {


  const classes = snapshotStatus ? SnapshotColors[status as SnapshotStatusType] : StatusColors[status as StatusType]

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>

        <TooltipTrigger>

          <span
            className={cx(
              "relative flex items-center justify-center",
              StatusSizes[size]
            )}
          >
            {["processing", "uploading", "queued-processing", "queued-uploading"].includes(status) && (
              <span
                className={cx(
                  "animate-ping absolute inline-flex h-3/4 w-3/4 rounded-full opacity-75",
                  classes
                )}
              />
            )}

            <span
              className={cx(
                "relative inline-flex rounded-full",
                StatusSizes[size],
                classes
              )}
            ></span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {status}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}