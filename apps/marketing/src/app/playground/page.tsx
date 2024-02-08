import { ExtendedSnapshotPair, Reviewer } from "@pixeleye/reviewer";
import { Build } from "@pixeleye/api";
import HomeBase from "./assets/home-baseline.png";
import HomeChanged from "./assets/home-changed.png";
import HomeDiff from "./assets/home-diff.png";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Playground | Pixeleye",
  description: "Try out the Pixeleye Reviewer component. This is what it looks like when you review a build.",
  alternates: {
    canonical: "https://pixeleye.io/playground",
  }
};

const dummyBuild: Build = {
  id: "1",
  branch: "main",
  buildNumber: 11,
  projectID: "1",
  status: "unreviewed",
  createdAt: new Date().toUTCString(),
  updatedAt: new Date().toUTCString(),
  errors: [],
  sha: "123",
  isLatest: true,
  title: "Playground build",
};

const dummySnapshots: ExtendedSnapshotPair[] = [
  {
    id: "1",
    buildID: "1",
    createdAt: new Date().toUTCString(),
    name: "Home",
    updatedAt: new Date().toUTCString(),
    status: "unreviewed",
    snapID: "1",
    baselineURL: HomeBase,
    snapURL: HomeChanged,
    diffURL: HomeDiff,
    baselineHash: "12",
    snapHash: "1",
    diffHash: "123",
    targetIcon: "chrome",
    baselineHeight: 1181,
    baselineWidth: 1265,
    snapHeight: 1181,
    baselineID: "1",
    snapWidth: 1265,
    variant: "dark",
    diffHeight: 1181,
    diffWidth: 1265,
    target: "chrome",
    viewport: "1024x768",
  },
  {
    id: "2",
    buildID: "2",
    createdAt: new Date().toUTCString(),
    name: "Home 2",
    updatedAt: new Date().toUTCString(),
    status: "unreviewed",
    snapID: "2",
    baselineURL: HomeBase,
    snapURL: HomeChanged,
    diffURL: HomeDiff,
    baselineHash: "122",
    snapHash: "2",
    diffHash: "1233",
    targetIcon: "chrome",
    baselineHeight: 1181,
    baselineWidth: 1265,
    snapHeight: 1181,
    baselineID: "1",
    snapWidth: 1265,
    variant: "dark",
    diffHeight: 1181,
    diffWidth: 1265,
    target: "chrome",
    viewport: "1024x768",
  },
];

const simulatedBrowsers = dummySnapshots.flatMap((snapshot) => ["chrome", "edge", "firefox", "safari"].map((browser) => ({ ...snapshot, id: snapshot.id + browser, targetIcon: browser })));

export default function PlaygroundPage() {
  return (
    <Suspense>
      <Reviewer
        userRole="admin"
        className="h-[calc(100vh-4rem-1px)] lg:h-[calc(100vh-4.5rem-1px)]"
        build={dummyBuild}
        snapshots={simulatedBrowsers}
        optimize
      />
    </Suspense>
  );
}
