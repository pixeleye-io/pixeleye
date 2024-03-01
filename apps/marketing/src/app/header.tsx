"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button, Logo } from "@pixeleye/ui";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "class-variance-authority";
import { DocSearch } from "./docs/search";
import { useQuery } from "@tanstack/react-query";
import { oryEndpoint } from "@pixeleye/auth";

const navigation = [
  { name: "Home", href: "/home" },
  {
    name: "Docs",
    href: "/docs/getting-started/introduction",
    selector: "/docs",
  },
  { name: "Pricing", href: "/pricing" },
  { name: "Playground", href: "/playground" },
];


export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = usePathname();

  const { isSuccess, isPending } = useQuery({
    queryKey: ["user"],
    queryFn: () => fetch(oryEndpoint + "/sessions/whoami")
  })

  return (
    <header className="bg-surface/90 backdrop-blur-sm fixed z-30 w-full border-b border-b-outline-variant">
      <nav
        className="mx-auto flex max-w-8xl items-center justify-between px-6 py-4 lg:px-8"
        aria-label="Global"
      >
        <div className="flex items-center gap-x-12">
          <NextLink
            href="/home"
            className={cx(
              "-m-1.5 p-1.5",
              pathname.startsWith("/home") && "!text-tertiary"
            )}
          >
            <span className="sr-only">Pixeleye</span>
            <Logo className="h-8 w-auto hover:text-tertiary transition-colors" />
          </NextLink>
          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.map((item) => (
              <NextLink
                key={item.name}
                href={item.href}
                className={cx(
                  "text-sm font-semibold leading-6 text-on-surface hover:text-tertiary transition-colors",
                  pathname.startsWith(item.selector || item.href) &&
                  "!text-tertiary"
                )}
              >
                {item.name}
              </NextLink>
            ))}

          </div>
        </div>
        <div className="flex items-center space-x-4">

          <NextLink
            href="https://github.com/pixeleye-io/pixeleye"
            className="text-sm hidden lg:block font-semibold leading-6 text-tertiary"
          >
            Star us on Github
          </NextLink>

          <DocSearch />

          <Button variant="outline" className="hidden lg:block">
            <NextLink href="/registration">Get started</NextLink>
          </Button>

          <Button
            type="button"
            variant="link"
            className="h-8 lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </Button>
        </div>
      </nav>
      <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <Dialog.Portal>
          <div className="fixed inset-0 z-10" />
          <Dialog.Content className="fixed lg:hidden inset-y-0 right-0 z-50 w-full overflow-y-auto bg-surface-container px-6 py-4 sm:max-w-sm sm:ring-1 sm:ring-outline-variant shadow">
            <div className="flex items-center justify-between -mt-0.5">
              <NextLink
                onClick={() => setMobileMenuOpen(false)}
                href="/home"
                className={cx(
                  "-mx-1.5 -mt-1 p-1.5",
                  pathname.startsWith("/home") && "!text-tertiary"
                )}
              >
                <span className="sr-only">Pixeleye</span>
                <Logo className="h-8 w-auto" />
              </NextLink>
              <Button
                type="button"
                variant="link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-outline-variant">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <NextLink
                      onClick={() => setMobileMenuOpen(false)}
                      key={item.name}
                      href={item.href}
                      className={cx(
                        "-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-on-surface-container hover:bg-surface-container-high",
                        pathname.startsWith(item.selector || item.href) &&
                        "!text-tertiary"
                      )}
                    >
                      {item.name}
                    </NextLink>
                  ))}
                </div>
                <div className="py-6 flex flex-col space-y-2">
                  <NextLink
                    href="https://github.com/pixeleye-io/pixeleye"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-on-surface-container hover:bg-surface-container-high"
                  >
                    Star us on Github
                  </NextLink>
                  <NextLink
                    href={isSuccess ? "/dashboard" : "/registration"}
                    className="-mx-3 w-28 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-on-surface-container hover:bg-surface-container-high"
                  >
                    {isPending ? "" : isSuccess ? "Dashboard" : "Get started"}
                  </NextLink>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
}
