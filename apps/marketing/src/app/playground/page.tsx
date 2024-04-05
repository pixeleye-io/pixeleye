import { Build } from "@pixeleye/api";
import { Metadata } from "next";
import { Suspense } from "react";
import InteractiveReviewer from "./interactiveReviewer";
import { cookies } from "next/headers";
import { snaps } from "./snaps";

export const metadata: Metadata = {
  title: "Playground | Pixeleye",
  description: "Try out the Pixeleye Reviewer component. This is what it looks like when you review a build.",
  alternates: {
    canonical: "https://pixeleye.io/playground",
  }
};

const dummyBuild: Build = {
  title: "Playground build",
  id: "Wl_wlIKwdpEqo6sJJ56Dy",
  createdAt: new Date().toUTCString(),
  updatedAt: new Date().toUTCString(),
  projectID: "Iog0lwMCso2OJmMa4Y_32",
  buildNumber: 11,
  isLatest: true,
  sha: "9f78910a545867c4825b939d82398c08e272a3e5",
  branch: "main",
  status: "unreviewed"
};



export default async function PlaygroundPage() {


  const defaultSidebarWidth = Number(cookies().get("reviewer-sidebar-width")?.value) || undefined
  const defaultSidebarOpen = cookies().get("reviewer-sidebar-open")?.value !== "false"


  return (
    <Suspense>
      <InteractiveReviewer build={dummyBuild} initialSnaps={snaps} defaultSidebarWidth={defaultSidebarWidth} defaultSidebarOpen={defaultSidebarOpen} />
    </Suspense>
  );
}
