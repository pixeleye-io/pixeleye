import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Logo } from "@pixeleye/ui/src/logo";
import { cx } from "class-variance-authority";
import { Button } from "@pixeleye/ui/src/button";
import { useQuery } from "@tanstack/react-query";

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

  const pathname = window?.location.pathname;

  // const { isSuccess, isPending } = useQuery({
  //   queryKey: ["user"],
  //   retry: false,
  //   // eslint-disable-next-line turbo/no-undeclared-env-vars
  //   queryFn: () => fetch(process.env.NEXT_PUBLIC_ORY_URL + "/sessions/whoami", {
  //     credentials: "include",
  //   }).then((res) => (res.ok) ? res.json() : Promise.reject(res)),
  // })

  const isSuccess = true;
  const isPending = false;

  return (
    <header className="bg-surface/90 backdrop-blur-sm fixed z-30 w-full border-b border-b-outline-variant">
      <nav
        className="mx-auto flex max-w-8xl items-center justify-between px-6 py-4 lg:px-8"
        aria-label="Global"
      >
        <div className="flex items-center gap-x-12">
          <a
            href="/home"
            className={cx(
              "-m-1.5 p-1.5",
              pathname.startsWith("/home") && "!text-tertiary"
            )}
          >
            <span className="sr-only">Pixeleye</span>
            <Logo className="h-8 w-auto hover:text-tertiary transition-colors" />
          </a>
          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={cx(
                  "text-sm font-semibold leading-6 text-on-surface hover:text-tertiary transition-colors",
                  pathname.startsWith(item.selector || item.href) &&
                  "!text-tertiary"
                )}
              >
                {item.name}
              </a>
            ))}

          </div>
        </div>
        <div className="flex items-center space-x-4">

          <a
            href="https://github.com/pixeleye-io/pixeleye"
            className="text-sm hidden lg:block font-semibold leading-6 text-tertiary"
          >
            Star us on Github
          </a>

          {/* DOC SEARCH */}
          <div id="docsearch"></div>

          {/* @ts-ignore */}

          <Button asChild variant="outline">
            <a className="hidden lg:block w-28" href={isSuccess ? "/dashboard" : "/registration"}>
              {isPending ? "" : isSuccess ? "Dashboard" : "Get started"}
            </a>
          </Button>

          {/* @ts-ignore */}

          <Button
            type="button"
            variant="link"
            className="h-8 lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            {/* @ts-ignore */}

            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </Button>
        </div>
      </nav>
      {/* @ts-ignore */}

      <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        {/* @ts-ignore */}

        <Dialog.Portal>
          <div className="fixed inset-0 z-10" />
          {/* @ts-ignore */}

          <Dialog.Content className="fixed lg:hidden inset-y-0 right-0 z-50 w-full overflow-y-auto bg-surface-container px-6 py-4 sm:max-w-sm sm:ring-1 sm:ring-outline-variant shadow">
            <div className="flex items-center justify-between -mt-0.5">
              <a
                onClick={() => setMobileMenuOpen(false)}
                href="/home"
                className={cx(
                  "-mx-1.5 -mt-1 p-1.5",
                  pathname.startsWith("/home") && "!text-tertiary"
                )}
              >
                <span className="sr-only">Pixeleye</span>
                <Logo className="h-8 w-auto" />
              </a>
              {/* @ts-ignore */}

              <Button
                type="button"
                variant="link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                {/* @ts-ignore */}
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-outline-variant">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <a
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
                    </a>
                  ))}
                </div>
                <div className="py-6 flex flex-col space-y-2">
                  <a
                    href="https://github.com/pixeleye-io/pixeleye"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-on-surface-container hover:bg-surface-container-high"
                  >
                    Star us on Github
                  </a>
                  {
                    !isPending && (
                      <a
                        href={isSuccess ? "/dashboard" : "/registration"}
                        className="-mx-3 w-28 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-on-surface-container hover:bg-surface-container-high"
                      >
                        {isSuccess ? "Dashboard" : "Get started"}
                      </a>
                    )}
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
}
