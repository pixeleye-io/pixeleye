import { API } from "@/libs";
import { Template } from "@/ui/template";
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

export default async function ProjectOverviewPage({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const buildID = params.id;

  const build = await API.get("/builds/{id}", {
    params: {
      id: buildID,
    },
    headers: {
      cookie: cookies().toString(),
    },
  });

  return <Template>Build</Template>;
}
