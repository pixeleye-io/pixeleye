import { ReactNode } from "react";
import { useReviewerStore } from "../store";
import { PanelHeader } from "./shared";

// Created
// Title
// Commit
// message
// Screenshot count
// Parent builds
// Child builds
// Target build
// Snapshots changed

// Errors
// Warnings

function InfoLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between py-3 text-sm font-medium">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="text-on-surface">{children}</dd>
    </div>
  );
}

// TODO - add build url for commit sha
// TODO - add pull request url for build
// TODO - add child builds
export default function BuildInfoPanel() {
  const build = useReviewerStore((state) => state.build);

  const snapshots = useReviewerStore((state) => state.snapshots);

  const snapshotCount = snapshots.length;

  const snapshotsChangedCount = snapshots.filter((snapshot) =>
    ["unreviewed", "approved", "rejected"].includes(snapshot.status)
  ).length;

  return (
    <div className="px-4 pt-4 flex flex-col">
      <PanelHeader title="Build info" />
      <div className="mt-4">
        <h3 className="font-medium text-on-surface">Details</h3>
        <dl className="mt-2 divide-y divide-outline-variant  border-b border-t border-outline-variant">
          <InfoLine label="Title">{build.title}</InfoLine>
          <InfoLine label="Created">{(new Date(build.createdAt)).toLocaleDateString()}</InfoLine>
          <InfoLine label="Commit">{build.sha}</InfoLine>
          <InfoLine label="Message">{build.message ?? "No message"}</InfoLine>
          <InfoLine label="Screenshot count">{snapshotCount}</InfoLine>
          <InfoLine label="Snapshots changed">{snapshotsChangedCount}</InfoLine>
          <InfoLine label="Parent builds">
            {build.parentBuildIDs?.join(", ") ?? "None"}
          </InfoLine>
          <InfoLine label="Target build">
            {build.targetBuildID ?? "None"}
          </InfoLine>
        </dl>
      </div>
    </div>
  );
}
