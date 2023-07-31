import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { Button, LogoWatching, Link } from "@pixeleye/ui";
import { Swiper } from "./swiper";

function Hero() {
  return (
    <div className="relative isolate overflow-hidden bg-surface">
      <svg
        className="absolute inset-0 -z-10 h-full w-full stroke-outline-variant/50 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="0787a7c5-978c-4f66-83c7-11c213f99cb7"
            width={200}
            height={200}
            x="50%"
            y={-1}
            patternUnits="userSpaceOnUse"
          >
            <path d="M.5 200V.5H200" fill="none" />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          strokeWidth={0}
          fill="url(#0787a7c5-978c-4f66-83c7-11c213f99cb7)"
        />
      </svg>
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
          <div className="flex text-on-surface">
            <LogoWatching className="w-16" />
            <h3 className="pt-1 text-4xl font-bold">
              <span className="sr-only">P</span>ixeleye
            </h3>
          </div>
          <div className="mt-24 sm:mt-32 lg:mt-16">
            <a href="#" className="inline-flex space-x-6 group">
              <span className="rounded-full bg-tertiary-container/75 px-3 py-1 text-sm font-semibold leading-6 text-on-tertiary-container ring-1 ring-inset ring-tertiary/75">
                What&apos;s new
              </span>
              <span className="inline-flex items-center space-x-1.5 text-sm font-medium leading-6 text-on-surface group-hover:text-tertiary">
                <span>Integrate with storybook</span>
                <ChevronRightIcon
                  className="h-5 w-5 group-hover:translate-x-0.5 transition ease-in-out duration-150"
                  aria-hidden="true"
                />
              </span>
            </a>
          </div>
          <h1 className="mt-10 text-5xl font-bold tracking-tight pb-2 text-tertiary sm:text-6xl">
            Open-source visual testing
          </h1>
          <p className="mt-4 text-lg leading-8 text-on-surface-variant">
            Pixeleye is an open-source, self-hostable platform for visual
            regression testing. Deliver pixel perfect UIs with confidence,
            effortlessly catching visual bugs before they reach production.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <Button>Sign up for free</Button>
            <Link
              size="sm"
              href="#"
              className="flex items-center justify-center group"
            >
              Read our docs
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
              <Swiper />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <div>
        <Hero />
      </div>
    </>
  );
}
