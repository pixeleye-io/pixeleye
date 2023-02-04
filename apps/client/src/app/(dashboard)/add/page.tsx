"use client";

import { Container } from "@pixeleye/ui";

export default function AddPage() {
  return (
    <>
      <Container className="py-12">
        <h1 className="text-4xl">Add project</h1>
        <p>setup a new project by selecting an option below</p>
      </Container>
      <Container className="flex flex-wrap items-center justify-center gap-8">
        <div className="flex flex-wrap items-center justify-center gap-8">
          <div className="w-56 h-56 mx-auo bg-neutral-900">Github</div>
          <div className="w-56 h-56 mx-auo bg-neutral-900">Gitlab</div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <div className="w-56 h-56 mx-auo bg-neutral-900">Bitbucket</div>
          <div className="w-56 h-56 mx-auo bg-neutral-900">Other</div>
        </div>
      </Container>
    </>
  );
}
