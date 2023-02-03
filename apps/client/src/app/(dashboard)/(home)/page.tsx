"use client";

import Link from "next/link";
import { Button, Container } from "@pixeleye/ui";

export default function IndexPage() {
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
