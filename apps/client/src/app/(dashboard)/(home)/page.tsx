"use client";

import Link from "next/link";
import { Button, Container } from "@pixeleye/ui";
import { api } from "~/utils/api";

export default function IndexPage() {
  const { data } = api.github.getInstallations.useQuery();

  console.log(data);

  return (
    <Container className="py-12">
      <div className="flex justify-between">
        <h1 className="text-4xl">Projects</h1>
        <Button asChild>
          <Link href="/add">Add project</Link>
        </Button>
      </div>
    </Container>
  );
}
