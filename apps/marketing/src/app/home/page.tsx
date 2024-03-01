import {
  ChevronRightIcon,
  LockClosedIcon,
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
import { ChromiumLogo, EdgeLogo, FirefoxLogo, WebkitLogo } from "@pixeleye/device-logos";

import {
  ArrowsPointingOutIcon,
  BookOpenIcon,
  CameraIcon,
  CloudArrowUpIcon,
  Square2StackIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import { Widget } from "./turnstile";
import { HighlightedDiff } from "./highlightedDiff";

export const metadata: Metadata = {
  title: "Open-source Visual Testing & Reviewing Platform | Pixeleye",
  description:
    "The all-batteries-included platform for visually testing and reviewing your UI; it's even self-hostable! Connect your codebase with our many integrations and dramatically increase your test coverage in minutes.",
  alternates: {
    canonical: "https://pixeleye.io/",
  },
  robots: {
    "max-image-preview": "none"
  }
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
      <div
        className="absolute  top-[35rem] left-10 -z-10 transform-gpu blur-3xl lg:top-[calc(50%-30rem)] lg:left-1/2"
        aria-hidden="true"
      >
        <div
          className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-tertiary to-secondary opacity-20"
          style={{
            clipPath:
              'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
          }}
        />
      </div>
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-32">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 pt-8">
          <div className="flex text-on-surface">
            <LogoWatching className="w-16" />
            <h3 className="pt-1 text-4xl font-bold">
              <span className="sr-only">P</span>ixeleye
            </h3>
          </div>
          <div className="mt-10 lg:mt-16">
            <NextLink href="/docs/integrations/storybook" className="inline-flex space-x-6 group">
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
            Open-source visual testing platform
          </h1>
          <p className="mt-4 text-lg leading-8 text-on-surface-variant">
            The all-batteries-included platform for visually testing and reviewing your UI; it&apos;s even self-hostable!
            Connect your codebase with our many integrations and dramatically increase your test coverage in minutes.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <Button asChild><NextLink href="/registration">Sign up for free</NextLink></Button>
            <Link
              asChild
              size="sm"
            >
              <NextLink
                href="/docs/getting-started/introduction"
                className="flex items-center justify-center group">
                Read our docs
              </NextLink>
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <Swiper />
          </div>
        </div>
      </div>
    </div>
  );
}

const browserLogos = [
  {
    name: "Chrome",
    logo: ChromiumLogo,
  },
  {
    name: "Firefox",
    logo: FirefoxLogo,
  },
  {
    name: "Safari",
    logo: WebkitLogo,
  },
  {
    name: "Edge",
    logo: EdgeLogo,
  },
];


function BrowsersCloud() {

  return (
    <div className="bg-surface-container py-24 sm:py-32 border-y border-outline/20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h3 className="text-2xl font-semibold text-center mb-12">
          Capture screenshots across multiple browsers and devices
        </h3>
        <div className="mx-auto grid max-w-lg grid-cols-2 sm:grid-cols-4 items-center gap-x-8 gap-y-12 sm:max-w-xl sm:gap-x-10 sm:gap-y-14 lg:mx-0 lg:max-w-none">
          {
            browserLogos.map(({ name, logo: Logo }) => (
              <div key={name} className="flex justify-center">
                <div className="flex flex-col text-on-surface-variant transition lg:flex-row hover:text-on-surface lg:space-x-4 lg:space-y-0 space-y-4 justify-center items-center w-56">
                  <Logo className="h-12 w-auto" />
                  <h4 className="font-bold text-lg">
                    {name}
                  </h4>
                </div>
              </div>
            ))
          }
        </div>
        <div className="mt-16 flex justify-center">
          <p className="relative rounded-full bg-tertiary-container text-sm leading-6 py-1.5 text-on-surface ring-1 ring-inset ring-tertiary/50">
            <NextLink href="/playground" className="text-on-tertiary-container space-x-1 py-4  px-4">
              Give it a go with our <span className="font-bold">Playground</span>
              <span aria-hidden="true">&rarr;</span>
            </NextLink>
          </p>
        </div>
      </div>
    </div>
  )
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
    <div className="py-24 sm:py-32">
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
      "Pixeleye integrates with any git VCS! We also offer extra functionality like permission syncing or PR comments for supported VCSs (Currently only Github).",
    icon: CloudArrowUpIcon,
  },
  {
    name: "CI integration.",
    description:
      "We've built our tools to support your CI. We want you're experience to be as seamless as possible.",
    icon: ServerIcon,
  },
  {
    name: "Framework integration.",
    description:
      "We have many options for taking our screenshots (Storybook, Cypress, Puppeteer, ...etc). And if we don't have an official integration, our CLI tool more than likely has you covered.",
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
    <div className="bg-surface-container border-y border-outline/20">
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
            <Button><NextLink href="/registration">Get started for free</NextLink></Button>
            <Link
              asChild
              size="sm"

            >
              <NextLink
                href="/playground"
                className="flex items-center justify-center group">
                Try our playground
              </NextLink>
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
              placeholder="you@domain.com"
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


const faqs = [
  {
    id: 1,
    question: "What's a snapshot?",
    answer:
      "A snapshot is a picture. You can take snapshots of individual components or even of your entire application. We use these snapshots to compare changes in your ui.",
  },
  {
    id: 2,
    question: "Do you integrate with GitHub, GitLab or Bitbucket?",
    answer:
      "Pixeleye will work with any VCS! We currently offer extra functionality for Github (permission syncing, pr comments, ...etc), but have plans to support GitLab and Bitbucket in the future.",
  },
  {
    id: 3,
    question: "Is there any vendor lock-in?",
    answer:
      "No, Pixeleye is open-source and self-hostable. Whilst we're confident you'll love our cloud solution, you can always run Pixeleye yourself.",
  },
  {
    id: 4,
    question: "What devices can I test on?",
    answer:
      "We currently support the Chromium, Firefox and Webkit rendering engines. We offer a range of preset settings for desktop, tablet and mobile devices as well as the ability to create your own.",
  },
  {
    id: 5,
    question: "Why should I use visual testing?",
    answer:
      "Browsers render your UI differently, CSS can have unintended side effects and your UI is constantly changing. Visual testing allows you to catch these issues before they reach production.",
  },
  {
    id: 6,
    question: "Why should I use your cloud solution?",
    answer: "Convenience and support. We handle the hosting, maintenance, scaling as well as ensuring you're on the latest version. Plus you'd be supporting Open Source!",
  },
];

function FAQ() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 border-t border-outline-variant">
      <h2 className="text-2xl font-bold leading-10 tracking-tight text-on-surface">
        Frequently asked questions
      </h2>
      <p className="mt-6 max-w-2xl text-base leading-7 text-on-surface-variant">
        Have a different question and can’t find the answer you’re looking
        for? Reach out to our support team by{" "}
        <Link href="mailto:support@pixeleye.io">sending us an email</Link> and we’ll get back to you as
        soon as we can.
      </p>
      <div className="mt-20">
        <dl className="space-y-16 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-16 sm:space-y-0 lg:gap-x-10">
          {faqs.map((faq) => (
            <div key={faq.id}>
              <dt className="text-base font-semibold leading-7 text-on-surface">
                {faq.question}
              </dt>
              <dd className="mt-2 text-base leading-7 text-on-surface-variant">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}


export default function HomePage() {
  return (
    <>
      <main>
        <Hero />
        <BrowsersCloud />
        <HighlightedDiff />
        <Features />
        <Integrations />
        <CTA />
        <NewsLetter />
        <FAQ />
      </main>
    </>
  );
}
