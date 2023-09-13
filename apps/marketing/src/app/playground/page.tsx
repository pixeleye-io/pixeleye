import { ExtendedSnapshotPair, Reviewer } from "@pixeleye/reviewer";
import { Build } from "@pixeleye/api";
import ukWiki from "./assets/uk-wiki.png";
import HomeBase from "./assets/home-baseline.png";
import HomeChanged from "./assets/home-changed.png";
import HomeDiff from "./assets/home-diff.png";
import { Metadata } from "next";

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
    name: "Button",
    updatedAt: new Date().toUTCString(),
    status: "unreviewed",
    snapID: "2",
    baselineURL: ukWiki,
    snapURL: ukWiki,
    diffURL: ukWiki,
    baselineHash: "3",
    snapHash: "32",
    diffHash: "321",
    baselineHeight: 32668,
    baselineWidth: 1574,
    snapHeight: 32668,
    baselineID: "2",
    snapWidth: 1574,
    variant: "default",
    diffHeight: 32668,
    diffWidth: 1574,
    target: "chrome",
    viewport: "1024x768",
  },
];

export default function PlaygroundPage() {
  return (
    <Reviewer
      className="h-[calc(100vh-4rem-1px)]"
      build={dummyBuild}
      snapshots={dummySnapshots}
      optimize
    />
  );
}
