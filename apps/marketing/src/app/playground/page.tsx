import { ExtendedSnapshotPair, Reviewer } from "@pixeleye/reviewer";
import { Build } from "@pixeleye/api";
import HomeBase from "./assets/home-baseline.png";
import HomeChanged from "./assets/home-changed.png";
import HomeDiff from "./assets/home-diff.png";
import GetStartedButton from "./assets/get-started-button.png";
import ViewOnGithubButton from "./assets/view-on-github-button.png";

import InstallationPageIphoneLight from "./assets/installation-page--iphone--light.png";
import InstallationPageIphoneDark from "./assets/installation-page--iphone--dark.png";

import { Metadata } from "next";
import { Suspense } from "react";
import { s } from "@markdoc/markdoc/dist/src/schema";
import InteractiveReviewer from "./interactiveReviewer";

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
  // {
  //   id: "2",
  //   buildID: "1",
  //   createdAt: new Date().toUTCString(),
  //   name: "Home 2",
  //   updatedAt: new Date().toUTCString(),
  //   status: "unreviewed",
  //   snapID: "2",
  //   baselineURL: HomeBase,
  //   snapURL: HomeChanged,
  //   diffURL: HomeDiff,
  //   baselineHash: "122",
  //   snapHash: "2",
  //   diffHash: "1233",
  //   targetIcon: "chrome",
  //   baselineHeight: 1181,
  //   baselineWidth: 1265,
  //   snapHeight: 1181,
  //   baselineID: "1",
  //   snapWidth: 1265,
  //   variant: "dark",
  //   diffHeight: 1181,
  //   diffWidth: 1265,
  //   target: "chrome",
  //   viewport: "1024x768",
  // },
  {
    id: "3",
    buildID: "1",
    createdAt: new Date().toUTCString(),
    name: "Button/Get Started",
    updatedAt: new Date().toUTCString(),
    status: "unchanged",
    snapID: "2",
    baselineURL: GetStartedButton,
    snapURL: GetStartedButton,
    baselineHash: "3",
    snapHash: "3",
    targetIcon: "chrome",
    baselineHeight: 170,
    baselineWidth: 417,
    snapHeight: 170,
    baselineID: "1",
    snapWidth: 417,
    variant: "dark",
    target: "chrome",
    viewport: "1024x768",
  },
  {
    id: "4",
    buildID: "1",
    createdAt: new Date().toUTCString(),
    name: "Button/View on Github",
    updatedAt: new Date().toUTCString(),
    status: "unchanged",
    snapID: "2",
    baselineURL: ViewOnGithubButton,
    snapURL: ViewOnGithubButton,
    baselineHash: "4",
    snapHash: "4",
    targetIcon: "chrome",
    baselineHeight: 170,
    baselineWidth: 492,
    snapHeight: 170,
    baselineID: "1",
    snapWidth: 492,
    variant: "dark",
    target: "chrome",
    viewport: "1024x768",
  },
  {
    id: "5",
    buildID: "1",
    createdAt: new Date().toUTCString(),
    name: "Installation Page",
    variant: "light",
    updatedAt: new Date().toUTCString(),
    status: "unchanged",
    snapID: "5",
    baselineURL: InstallationPageIphoneLight,
    snapURL: InstallationPageIphoneLight,
    baselineHash: "5",
    snapHash: "5",
    targetIcon: "chrome",
    baselineHeight: 812,
    baselineWidth: 375,
    snapHeight: 812,
    baselineID: "1",
    snapWidth: 375,
    target: "chrome",
    viewport: "375x812",
  },
  {
    id: "6",
    buildID: "1",
    createdAt: new Date().toUTCString(),
    name: "Installation Page",
    updatedAt: new Date().toUTCString(),
    status: "unchanged",
    snapID: "6",
    baselineURL: InstallationPageIphoneDark,
    snapURL: InstallationPageIphoneDark,
    baselineHash: "6",
    snapHash: "6",
    targetIcon: "chrome",
    baselineHeight: 812,
    baselineWidth: 375,
    snapHeight: 812,
    baselineID: "1",
    snapWidth: 375,
    variant: "dark",
    target: "chrome",
    viewport: "375x812",
  },

];

const simulatedBrowsers = dummySnapshots.flatMap((snapshot) => ["chrome", "edge", "firefox", "safari"].map((browser) => ({ ...snapshot, id: snapshot.id + browser, targetIcon: browser, target: browser })));

export default function PlaygroundPage() {

  return (
    <Suspense>
      <InteractiveReviewer build={dummyBuild} initialSnaps={simulatedBrowsers} />
    </Suspense>
  );
}
