import { Reviewer } from "@pixeleye/reviewer";
import { Build, Snapshot } from "@pixeleye/api";

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

const dummySnapshots: Snapshot[] = [
  {
    id: "1",
    buildID: "1",
    createdAt: new Date().toUTCString(),
    name: "Button",
    updatedAt: new Date().toUTCString(),
    status: "unreviewed",
    snapID: "1",
  },
];

export default function PlaygroundPage() {
  return <Reviewer build={dummyBuild} snapshots={dummySnapshots} />;
}
