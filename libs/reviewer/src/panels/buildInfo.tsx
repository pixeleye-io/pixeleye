import { ReactNode, useContext } from "react";
import { StoreContext } from "../store";
import { PanelHeader } from "./shared";
import { useStore } from "zustand";

// Errors
// Warnings

function InfoLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between py-3 text-sm font-medium space-x-2">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="text-on-surface truncate">{children}</dd>
    </div>
  );
}

// TODO - add build url for commit sha
// TODO - add pull request url for build
// TODO - add child builds
export default function BuildInfoPanel() {
  const store = useContext(StoreContext)!

  const build = useStore(store, (state) => state.build);

  const snapshots = useStore(store, (state) => state.snapshots);

  const snapshotCount = snapshots.reduce((acc, snapshot) => acc + snapshot.snapshots.length, 0);

  const snapshotsChangedCount = snapshots.filter((snapshot) =>
    ["unreviewed", "approved", "rejected"].includes(snapshot.status)
  ).length;

  return (
    <div className="px-4 pt-4 flex flex-col w-full">
      <PanelHeader title="Build info" />
      <div className="mt-4">
        <h3 className="font-medium text-on-surface">Details</h3>
        <dl className="mt-2 divide-y divide-outline-variant  border-b border-t border-outline-variant">
          <InfoLine label="Title">{build.title}</InfoLine>
          <InfoLine label="Created">{(new Date(build.createdAt)).toLocaleDateString()}</InfoLine>
          <InfoLine label="Sha">{build.sha}</InfoLine>
          <InfoLine label="Message">{build.message ?? "No message"}</InfoLine>
          <InfoLine label="Snap count">{snapshotCount}</InfoLine>
          <InfoLine label="Snaps changed">{snapshotsChangedCount}</InfoLine>
          <InfoLine label="Parent builds">
            {build.parentIDs?.toString() ?? "None"}
          </InfoLine>
          <InfoLine label="Comparison builds">
            {build.targetBuildIDs ?? "None"}
          </InfoLine>
        </dl>
      </div>
    </div>
  );
}
