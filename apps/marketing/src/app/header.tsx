"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button, Logo } from "@pixeleye/ui";
import NextLink from "next/link";

const navigation = [
  { name: "Home", href: "/home" },
  { name: "Docs", href: "/docs/getting-started/introduction" },
  { name: "Pricing", href: "/pricing" },
  { name: "Playground", href: "/playground" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-surface/90 backdrop-blur-sm fixed z-30 w-full border-b border-b-outline-variant">
      <nav
        className="mx-auto flex max-w-8xl items-center justify-between px-6 py-4 lg:px-8"
        aria-label="Global"
      >
        <div className="flex items-center gap-x-12">
          <NextLink href="/home" className="-m-1.5 p-1.5">
            <span className="sr-only">Pixeleye</span>
            <Logo className="h-8 w-auto hover:text-tertiary transition-colors" />
          </NextLink>
          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.map((item) => (
              <NextLink
                key={item.name}
                href={item.href}
                className="text-sm font-semibold leading-6 text-on-surface hover:text-tertiary transition-colors"
              >
                {item.name}
              </NextLink>
            ))}
          </div>
        </div>
        <div className="flex lg:hidden">
          <Button
            type="button"
            variant="link"
            className="h-8"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </Button>
        </div>
        <div className="hidden lg:flex">
          <NextLink
            href="#"
            className="text-sm font-semibold leading-6 text-tertiary"
          >
            Get started <span aria-hidden="true">&rarr;</span>
          </NextLink>
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
                className="-mx-1.5 -mt-1 p-1.5"
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
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-on-surface-container hover:bg-surface-container-high"
                    >
                      {item.name}
                    </NextLink>
                  ))}
                </div>
                <div className="py-6">
                  <NextLink
                    href="#"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-on-surface-container hover:bg-surface-container-high"
                  >
                    Get started
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
