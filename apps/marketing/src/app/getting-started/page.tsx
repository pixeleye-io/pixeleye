import { Button } from "@pixeleye/ui";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Getting Started | Pixeleye",
  description: "How to get started with Pixeleye",
};

export default function GettingStartedPage() {
  return (
    <div className="mt-24 flex items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-on-surface mb-6">
          Cloud Hosting Shutdown
        </h1>

        <p className="text-xl text-on-surface-variant mb-4">
          We've had to take the difficult decision to shutdown our cloud hosting
          of Pixeleye.
        </p>

        <p className="text-lg text-on-surface-variant mb-8">
          The project is still alive and self-hostable.
        </p>

        <Button asChild size="lg">
          <Link href="/docs/guides/self-hosting">Self Host</Link>
        </Button>
      </div>
    </div>
  );
}
