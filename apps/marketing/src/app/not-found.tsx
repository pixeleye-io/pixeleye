import { Link } from "@pixeleye/ui";
import NextLink from "next/link";

export default function NotFound() {
  return (
    <main className="grid place-items-center bg-surface px-6 py-24 sm:py-32 lg:px-8 min-h-screen">
      <div className="text-center">
        <p className="text-base font-semibold text-tertiary">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-on-surface sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-6 text-base leading-7 text-on-surface-variant">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link asChild>
            <NextLink href="/home">Go back home</NextLink>
          </Link>

          <a
            href="mailto:support@pixeleye.io"
            className="text-sm font-semibold text-on-surface"
          >
            Contact support <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </main>
  );
}
