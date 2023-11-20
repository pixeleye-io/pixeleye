import Link from "next/link";
import { Button } from "@pixeleye/ui";
import { Session } from "@ory/client";
import { cookies } from "next/headers";
import { oryEndpoint } from "./(auth)/utils";
import { env } from "@/env";

export function UnauthenticatedPage() {
  return (
    <main className="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-base font-semibold text-tertiary">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-on-surface sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-6 text-base leading-7 text-on-surface-variant">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button asChild>
            <Link href="https://pixeleye.io/home">Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

export default async function NotFoundPage() {
  const data = await fetch(oryEndpoint + "/sessions/whoami", {
    headers: {
      cookie: cookies().toString(),
    },
  }).catch(() => null);

  const session = (await data?.json()) as Session | undefined;

  if (!data || data.status >= 300 || data.status < 200 || !session) {
    return <UnauthenticatedPage />;
  }

  return (
    <>
      <main className="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
        <div className="text-center">
          <p className="text-base font-semibold text-tertiary">404</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-on-surface sm:text-5xl">
            Page not found
          </h1>
          <p className="mt-6 text-base leading-7 text-on-surface-variant">
            Sorry, we couldn’t find the page you’re looking for.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild>
              <Link href={`${env.NEXT_PUBLIC_SERVER_URL}/dashboard`}>Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}