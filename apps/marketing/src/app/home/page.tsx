import {
  ChevronRightIcon,
  ServerIcon,
  WindowIcon,
} from "@heroicons/react/20/solid";
import { Button, LogoWatching, Link, Input } from "@pixeleye/ui";
import { Swiper } from "./swiper";
import NextLink from "next/link";
import { Metadata } from "next";
import LogoOrbit from "./logoOrbit";
import SendGrid from "@sendgrid/client";
import z from "zod";

import {
  ArrowsPointingOutIcon,
  BookOpenIcon,
  CameraIcon,
  CloudArrowUpIcon,
  Square2StackIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import { Widget } from "./turnstile";

export const metadata: Metadata = {
  title: "Home | Pixeleye",
  description:
    "Pixeleye is an open-source, self-hostable platform for visual regression testing. Deliver pixel perfect UIs with confidence, effortlessly catching visual bugs before they reach production.",
  alternates: {
    canonical: "https://pixeleye.io/",
  },
};

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
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-32">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 pt-8">
          <div className="flex text-on-surface">
            <LogoWatching className="w-16" />
            <h3 className="pt-1 text-4xl font-bold">
              <span className="sr-only">P</span>ixeleye
            </h3>
          </div>
          <div className="mt-10 lg:mt-16">
            <NextLink href="#" className="inline-flex space-x-6 group">
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
            </NextLink>
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
              href="/docs/getting-started/introduction"
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

const features = [
  {
    name: "Cross-browser testing.",
    description:
      "Capture screenshots across multiple browsers and devices. Pixeleye allows you to increase your test converge over alternative solutions.",
    icon: WindowIcon,
  },
  {
    name: "Responsive testing.",
    description:
      "Capture screenshots across multiple browsers and devices. UI adapts to screen sizes, why shouldn't your tests?",
    icon: ArrowsPointingOutIcon,
  },
  {
    name: "Self-hostable.",
    description:
      "We have an awesome cloud solution, but if you want to keep your data in-house, Pixeleye is self-hostable.",
    icon: ServerIcon,
  },
  {
    name: "Role syncing.",
    description:
      "You've already setup your roles in your vcs, why do it again? Pixeleye syncs your roles from your vcs.",
    icon: UsersIcon,
  },
  {
    name: "UI reviews.",
    description:
      "Pixeleye boasts a powerful diff reviewer, allowing you to easily spot visual regressions and approving valid changes.",
    icon: Square2StackIcon,
  },
  {
    name: "Open-source.",
    description:
      "Pixeleye is open-source, meaning you can contribute to the project and help shape the future of visual testing.",
    icon: BookOpenIcon,
  },
];

function Features() {
  return (
    <div className="py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-base font-semibold leading-7 text-tertiary">
            All in one platform
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
            Pixel perfect UIs made easy
          </p>
          <p className="mt-6 text-lg leading-8 text-on-surface-variant">
            Pixeleye is stuffed with features and hosts multiple integrations
            across the entire development pipeline. It&apos;s a vital tool for
            delivering a consistent user experience.
          </p>
        </div>
        <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 text-base leading-7 text-on-surface-variant sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:gap-x-16">
          {features.map((feature) => (
            <div key={feature.name} className="relative pl-9">
              <dt className="inline font-semibold text-on-surface">
                <feature.icon
                  className="absolute left-1 top-1 h-5 w-5 text-tertiary"
                  aria-hidden="true"
                />
                {feature.name}
              </dt>{" "}
              <dd className="inline">{feature.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

const integrations = [
  {
    name: "VCS integration.",
    description:
      "Pixeleye integrates with your VCS, allowing you to sync your roles, see updates on PRs and much more.",
    icon: CloudArrowUpIcon,
  },
  {
    name: "CI integration.",
    description:
      "We've built our tools to support your CI. Pixeleye integrates with your CI, allowing you to run tests on every PR.",
    icon: ServerIcon,
  },
  {
    name: "Framework integration.",
    description:
      "We have multiple options for taking our screenshots. We're confident we have an option that works for you.",
    icon: CameraIcon,
  },
];

function Integrations() {
  return (
    <div className="overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          <div className="lg:ml-auto lg:pl-4 lg:pt-4">
            <div className="lg:max-w-lg">
              <h2 className="text-base font-semibold leading-7 text-tertiary">
                Seamless integration
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
                Integrate with your existing workflow
              </p>
              <p className="mt-6 text-lg leading-8 text-on-surface-variant">
                We built Pixeleye from the ground up focusing on developer
                experience. Our goal is for Pixeleye to add huge value whilst
                being as unobtrusive as possible.
              </p>
              <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-on-surface-variant lg:max-w-none">
                {integrations.map((integration) => (
                  <div key={integration.name} className="relative pl-9">
                    <dt className="inline font-semibold text-on-surface">
                      <integration.icon
                        className="absolute left-1 top-1 h-5 w-5 text-tertiary"
                        aria-hidden="true"
                      />
                      {integration.name}
                    </dt>{" "}
                    <dd className="inline">{integration.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="flex items-center justify-end lg:order-first">
            <LogoOrbit />
          </div>
        </div>
      </div>
    </div>
  );
}

function CTA() {
  return (
    <div className="bg-surface-container-low">
      <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
            <span className="text-tertiary">Maximize your coverage.</span>
            <br />
            Start for free or try our playground.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-on-surface-variant">
            We offer a massive free tier as well as an option to self-host. Try
            our playground to see if Pixeleye is right for you.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button>Get started for free</Button>
            <Link
              size="sm"
              href="/playground"
              className="flex items-center justify-center group"
            >
              Try our playground
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const SignUpFormSchema = z.object({
  email: z.string().email(),
  "cf-turnstile-response": z.string(),
});

function NewsLetter() {
  async function SignUp(formData: FormData) {
    "use server";

    const parsed = SignUpFormSchema.parse({
      email: formData.get("email"),
      "cf-turnstile-response": formData.get("cf-turnstile-response"),
    });

    let formData2 = new FormData();
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    formData2.append("secret", process.env.CF_TURNSTILE!);
    formData2.append("response", parsed["cf-turnstile-response"]);
    // formData.append("remoteip", ip);

    const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    const result = await fetch(url, {
      body: formData2,
      method: "POST",
    });

    const outcome = await result.json();
    if (!outcome.success) {
      throw new Error("Failed cloudflare turnstile");
    }

    // eslint-disable-next-line turbo/no-undeclared-env-vars
    SendGrid.setApiKey(process.env.SEND_GRID!);

    const data = {
      list_ids: ["de5866b0-0692-4ade-bdd1-f781c05c33a1"],
      contacts: [
        {
          email: parsed.email,
        },
      ],
    };

    let success = true;

    await SendGrid.request({
      url: `/v3/marketing/contacts`,
      method: "PUT",
      body: data,
    }).catch((error) => {
      success = false;
    });

    if (!success) throw new Error("Failed to sign up for newsletter");
  }

  return (
    <div className="py-16 sm:py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 lg:grid-cols-12 lg:gap-8 lg:px-8">
        <div className="max-w-xl text-3xl font-bold tracking-tight text-on-surface  lg:col-span-7">
          <h2 className="inline sm:block lg:inline xl:block">
            Want product news and updates?
          </h2>{" "}
          <p className="inline sm:block lg:inline xl:block">
            Sign up for our newsletter.
          </p>
        </div>
        <form action={SignUp} className="w-full max-w-md lg:col-span-5 lg:pt-2">
          <div className="flex gap-x-4 ">
            <Input
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              required
            />
            <Button className="self-end">Subscribe</Button>
          </div>
          <p className="my-4 text-sm leading-6 text-on-surface">
            We care about your data. Read our{" "}
            <Link size="sm" href="/privacy.html" className="!text-sm">
              privacy&nbsp;policy
            </Link>
            .
          </p>
          <Widget />
        </form>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <main>
        <Hero />
        <Features />
        <Integrations />
        <CTA />
        <NewsLetter />
      </main>
    </>
  );
}
