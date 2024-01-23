import { LogoWatching } from "@pixeleye/ui";
import NextLink from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 min-h-screen">
      <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 lg:w-3/5">
        <div className="w-full max-w-sm mx-auto ">{children}</div>
      </div>
      <div className="relative z-0 items-center flex-1 hidden w-0 lg:flex">
        <span className="absolute inset-y-0 border-l border-outline-variant left-10" />
        <NextLink href="https://pixeleye.io/home" className="z-10 flex py-4 bg-surface text-on-surface hover:text-tertiary">
          <LogoWatching className="w-16" />
          <h3 className="pt-1 text-4xl font-bold">ixeleye</h3>
        </NextLink>
      </div>
    </div>
  );
}
