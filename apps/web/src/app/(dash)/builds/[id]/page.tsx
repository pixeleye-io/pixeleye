import { API } from "@/libs";
import { Template } from "@/ui/template";
import { Reviewer } from "@pixeleye/reviewer";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Button,
} from "@pixeleye/ui";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

const dummyBuild = {
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

const dummySnapshots = [
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

export default async function ProjectOverviewPage({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const buildID = params.id;


  const [build, snapshots] = await Promise.all([API.get("/builds/{id}", {
    params: {
      id: buildID,
    },
    headers: {
      cookie: cookies().toString(),
    },
  }),
  await API.get("/builds/{id}/snapshots", {
    params: {
      id: buildID,
    },
    headers: {
      cookie: cookies().toString(),
    },
  })
  ]);



  return (
      <Reviewer build={build} snapshots={snapshots} />
  );
}
