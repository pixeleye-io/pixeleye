import { CheckIcon } from "@heroicons/react/20/solid";
import {
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@pixeleye/ui";
import { cx } from "class-variance-authority";
import NextLink from "next/link";
import { Calculator } from "./calculator";
import { FAQ } from "./faq";
import { Examples } from "./examples";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pricing | Pixeleye",
    description: "Want to avoid the hassle of setting up and maintaining your own instance? We offer a hosted solution for you.",
  };

const tiers = [
  {
    name: "Hobby",
    id: "tier-hobby",
    href: "#",
    priceMonthly: "Free",
    cta: "Get started",
    description:
      "More than enough for side projects or evaluating the platform.",
    features: [
      "5000 monthly snapshots",
      "Unlimited projects",
      "Unlimited collaborators",
    ],
    mostPopular: false,
  },
  {
    name: "Pro",
    id: "tier-pro",
    href: "#",
    priceMonthly: "From $0",
    perMonth: true,
    description: "A usage-based plan mostly for small to medium teams.",
    cta: "Buy plan",
    features: [
      "5000 free monthly snapshots",
      "$0.003 per snapshot after",
      "Unlimited projects",
      "Unlimited collaborators",
    ],
    mostPopular: true,
  },
  {
    name: "Enterprise",
    id: "tier-enterprise",
    href: "#",
    priceMonthly: "Custom",
    cta: "Contact us",
    description: "Dedicated support and infrastructure for your company.",
    features: ["Volume discounts", "Dedicated support", "Custom contracts"],
    mostPopular: false,
  },
];

function SelfHostBanner() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 sm:flex sm:justify-center sm:px-6 sm:pb-5 lg:px-8">
      <div className="pointer-events-auto flex items-center justify-between gap-x-6 bg-tertiary-container px-6 py-2.5 sm:rounded-xl sm:py-3 sm:pl-4 sm:pr-3.5">
        <p className="text-sm leading-6 text-white">
          <NextLink href="/docs/self-hosting/getting-started">
            <strong className="font-semibold">Want to self host?</strong>
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
    <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-12">
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
              tier.mostPopular ? "lg:z-10 lg:rounded-b-none" : "lg:mt-8",
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
                    tier.mostPopular ? "text-tertiary" : "text-on-surface",
                    "text-lg font-semibold leading-8"
                  )}
                >
                  {tier.name}
                </h3>
                {tier.mostPopular ? (
                  <p className="rounded-full bg-tertiary/10 px-2.5 py-1 text-xs font-semibold leading-5 text-tertiary">
                    Most popular
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
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon
                      className="h-6 w-5 flex-none text-tertiary"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              asChild
              full
              variant={tier.mostPopular ? "default" : "outline"}
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
