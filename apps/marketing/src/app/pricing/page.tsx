import { CheckIcon } from "@heroicons/react/20/solid";
import {
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  Link,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@pixeleye/ui";
import { cx } from "class-variance-authority";
import NextLink from "next/link";
import { Calculator } from "./calculator";
import { FAQ } from "./faq";
import { Examples } from "./examples";
import { Metadata } from "next";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/solid";

// TODO - get this from stripe
const volumePricing = {
  "First 5,000~7,500": "Free",
  "For the first billable 100,000": "$0.003",
  "For the next 100,001 to 250,000": "$0.0025",
  "For the next 250,001 to 600,000": "$0.0022",
  "For the next 600,001 to 2,000,000": "$0.0019",
  "For the next 2,000,001 to 5,000,000": "$0.0017",
  "For anything above 5,000,001": "$0.0015",
}

export const metadata: Metadata = {
  title: "Pricing | Pixeleye",
  description: "Want to avoid the hassle of setting up and maintaining your own instance? We offer a hosted solution for you.",
};

function SnapshotsMoreInfoContext() {

  return (
    <p>
      Every team gets 5,000 free snapshots. Users can earn an additional 1,250 snapshots by referring a friend for a total of 7,500 snapshots.
    </p>
  )
}

const tiers = [
  {
    name: "Hobby",
    id: "tier-hobby",
    href: "/registration",
    priceMonthly: "Free",
    cta: "Get started",
    description:
      "More than enough for side projects or evaluating the platform.",
    features: [
      {
        text: "Up to 7,500 free monthly snapshots",
        moreInfo: SnapshotsMoreInfoContext
      },
      "Unlimited projects",
      "Unlimited collaborators",
    ],
    awesomeValue: false,
  },
  {
    name: "Pro",
    id: "tier-pro",
    href: "/registration",
    priceMonthly: "From $0",
    perMonth: true,
    description: "A usage-based plan mostly for small to medium teams.",
    cta: "Get started",
    priceModalIndex: 1,
    features: [
      {
        text: "Up to 7,500 free monthly snapshots",
        moreInfo: SnapshotsMoreInfoContext
      },
      "Volume pricing starting at $0.003",
      "Unlimited projects",
      "Unlimited collaborators",
    ],
    awesomeValue: true,
  },
  {
    name: "Enterprise",
    id: "tier-enterprise",
    href: "mailto:enquiries@pixeleye.io",
    priceMonthly: "Custom",
    cta: "Contact us",
    description: "Dedicated support and discounted pricing.",
    features: ["SSO (coming soon)", "Dedicated support", "Custom contracts"],
    awesomeValue: false,
  },
];

function SelfHostBanner() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 sm:flex sm:justify-center sm:px-6 sm:pb-5 lg:px-8">
      <div className="pointer-events-auto flex items-center justify-between gap-x-6 bg-tertiary-container text-on-tertiary-container px-6 py-2.5 sm:rounded-xl sm:py-3 sm:pl-4 sm:pr-3.5">
        <p className="text-sm leading-6 text-on-tertiary-container">
          <NextLink href="/docs/self-hosting/getting-started">
            <strong className="font-semibold ">Want to self host?</strong>
            <svg
              viewBox="0 0 2 2"
              className="mx-2 inline h-0.5 w-0.5 fill-current"
              aria-hidden="true"
            >
              <circle cx={1} cy={1} r={1} />
            </svg>
            Read our docs to get started&nbsp;
            <span aria-hidden="true">&rarr;</span>
          </NextLink>
        </p>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-20">
      <div className="mx-auto max-w-2xl sm:text-center">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
          Simple no-tricks pricing
        </h1>
        <p className="mt-6 text-lg leading-8 text-on-surface-variant">
          You only pay for what you use; no surprise fees. With a generous free
          tier and extremely low price per snapshot, you can empower your entire
          team without breaking the bank.
        </p>
      </div>

      <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        {tiers.map((tier, tierIdx) => (
          <div
            key={tier.id}
            className={cx(
              tier.awesomeValue ? "lg:z-10 lg:rounded-b-none" : "lg:mt-8",
              tierIdx === 0 ? "lg:rounded-r-none" : "",
              tierIdx === tiers.length - 1 ? "lg:rounded-l-none" : "",
              "flex flex-col justify-between rounded-3xl bg-surface-container-low p-8 ring-1 ring-outline-variant xl:p-10"
            )}
          >
            <div className="mb-12">
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  id={tier.id}
                  className={cx(
                    tier.awesomeValue ? "text-tertiary" : "text-on-surface",
                    "text-lg font-semibold leading-8"
                  )}
                >
                  {tier.name}
                </h3>
                {tier.awesomeValue ? (
                  <p className="rounded-full bg-tertiary/10 px-2.5 py-1 text-xs font-semibold leading-5 text-tertiary">
                    Awesome value
                  </p>
                ) : null}
              </div>
              <p className="mt-4 text-sm leading-6 text-on-surface-variant">
                {tier.description}
              </p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-on-surface">
                  {tier.priceMonthly}
                </span>
                {tier.perMonth && (
                  <span className="text-sm font-semibold leading-6 text-on-surface-variant">
                    /month
                  </span>
                )}
              </p>
              <ul
                role="list"
                className="mt-8 space-y-3 text-sm leading-6 text-on-surface-variant"
              >
                {tier.features.map((feature, i) => {

                  const MoreInfoContent = typeof feature === "object" && feature.moreInfo


                  return (
                    <li key={typeof feature === "string" ? feature : feature.text} className="flex gap-x-3 items-center">
                      {
                        tier.priceModalIndex === i ? (
                          <PricingModal>
                            <CheckIcon
                              className="h-6 w-5 flex-none text-tertiary"
                              aria-hidden="true"
                            />
                            {typeof feature === "string" ? feature : feature.text}
                          </PricingModal>
                        )
                          : <>
                            <CheckIcon
                              className="h-6 w-5 flex-none text-tertiary"
                              aria-hidden="true"
                            />
                            {typeof feature === "string" ? feature : feature.text}
                            {
                              MoreInfoContent && (
                                <>
                                  <Popover>
                                    <PopoverTrigger>
                                      <QuestionMarkCircleIcon className="h-4 w-4 hover:text-on-surface" />
                                    </PopoverTrigger>
                                    <PopoverContent>
                                      <MoreInfoContent />
                                    </PopoverContent>
                                  </Popover>
                                </>
                              )
                            }
                          </>
                      }
                    </li>
                  )
                })}
              </ul>
            </div>
            <Button
              asChild
              full
              variant={tier.awesomeValue ? "default" : "outline"}
            >
              <a
                href={tier.href}
                aria-describedby={tier.id}
                className="text-center w-full"
              >
                {tier.cta}
              </a>
            </Button>
          </div>
        ))}
      </div>

      <div className="relative mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:mt-5 lg:px-8">
        <div className="mx-auto max-w-md lg:max-w-5xl">
          <div className="rounded-lg border border-outline-variant px-6 py-8 sm:p-10 lg:flex lg:items-center">
            <div className="flex-1">
              <div>
                <h3 className="inline-flex rounded-full text-lg py-1 font-semibold text-on-surface">
                  Free for open source
                </h3>
              </div>
              <div className="mt-4 text-lg text-on-surface-variant">
                As open source maintainers ourselves, we understand the difficulty of maintaining a project.
                Email us describing your project and at our discretion, we&apos;ll cover your usage.
              </div>
            </div>
            <div className="mt-6 rounded-md shadow lg:ml-10 lg:mt-0 lg:flex-shrink-0">
              <Button variant="secondary" asChild>
                <a
                  href="mailto:enquiries@pixeleye.io">
                  Contact us
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-32 mx-auto max-w-3xl sm:text-center">
        <div className="mb-12">
          <h2 className="text-on-surface text-3xl font-semibold mb-4">
            Usage Estimation
          </h2>
          <p className="text-on-surface-variant ">
            Calculate your usage to estimate your monthly bill or simply
            checkout our examples
          </p>
        </div>
        <Tabs
          defaultValue="calculator"
          className="w-full flex flex-col justify-center"
        >
          <TabsList className="mx-auto">
            <TabsTrigger value="calculator">Calculate your usage</TabsTrigger>
            <TabsTrigger value="examples">Example bills</TabsTrigger>
          </TabsList>
          <div>
            <TabsContent value="calculator">
              <Calculator />
            </TabsContent>
            <TabsContent value="examples">
              <Examples />
            </TabsContent>
          </div>
        </Tabs>
      </div>
      <FAQ />
      <SelfHostBanner />
    </div>
  );
}



function PricingModal({
  children,

}: {
  children: React.ReactNode;
}) {




  return (
    <Dialog>
      <Link asChild size="sm">
        <DialogTrigger className="flex gap-x-3 !text-sm">
          {children}
        </DialogTrigger>
      </Link>

      <DialogPortal>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Volume Pricing</DialogTitle>
            <DialogDescription>
              We want to make sure you get the best deal possible. That&apos;s why we openly offer volume discounts.
            </DialogDescription>
          </DialogHeader>


          <div className="p-4">


            <ul role="list" className="flex flex-col space-y-2">
              {Object.entries(volumePricing).map(([key, value]) => (
                <li key={key} className="flex justify-between">
                  <p>{key}</p>
                  <p className="text-start min-w-16">{value}</p>
                </li>
              ))}
            </ul>
          </div>

          <DialogFooter>
            <Button>
              Get started with Pro
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )


}