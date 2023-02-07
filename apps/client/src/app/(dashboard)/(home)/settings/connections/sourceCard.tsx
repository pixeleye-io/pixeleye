import Image from "next/image";
import Link from "next/link";
import { AdjustmentsHorizontalIcon, PlusIcon } from "@heroicons/react/24/solid";
import { cx } from "class-variance-authority";

export interface ConnectionCardProps {
  name: string;
  description: string;
  imageUrl: {
    light: string;
    dark: string;
  };
  href: string;
  connected: boolean;
}

export default function SourceCard({
  name,
  imageUrl,
  connected,
  description,
  href,
}: ConnectionCardProps) {
  return (
    <li
      key={name}
      className="flex flex-col col-span-1 text-center border divide-y rounded-lg shadow divide-neutral-300 dark:divide-neutral-700 border-neutral-300 dark:border-neutral-700"
    >
      <div className="flex flex-col flex-1 p-8">
        <Image
          width={128}
          height={128}
          className="flex-shrink-0 w-32 h-32 mx-auto rounded-full dark:hidden"
          src={imageUrl.light}
          alt={`${name} logo`}
        />
        <Image
          width={128}
          height={128}
          className="flex-shrink-0 hidden w-32 h-32 mx-auto rounded-full dark:block"
          src={imageUrl.dark}
          alt={`${name} logo`}
        />
        <h3 className="mt-6 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {name}
        </h3>
        <dl className="flex flex-col justify-between flex-grow mt-1">
          <dd className="text-sm text-neutral-500 dark:text-neutral-300">
            {description}
          </dd>
          <dd className="mt-3">
            <span
              className={cx(
                "px-2 py-1 text-xs font-medium rounded-full",
                connected
                  ? "text-green-800 bg-green-100"
                  : "text-amber-800 bg-amber-100",
              )}
            >
              {connected ? "Connected" : "Not connected"}
            </span>
          </dd>
        </dl>
      </div>
      <div>
        <div className="flex -mt-px divide-x divide-neutral-300 dark:divide-neutral-700">
          {connected && (
            <div className="flex flex-1 w-0">
              <Link
                href={`/add?source=${name.toLowerCase()}`}
                className="relative inline-flex items-center justify-center flex-1 w-0 py-4 -mr-px text-sm font-medium border border-transparent rounded-bl-lg text-neutral-700 dark:text-neutral-300 dark:hover:text-neutral-100 hover:text-gray-500"
              >
                <PlusIcon className="w-5 h-5" aria-hidden="true" />
                <span className="ml-3">Add project</span>
              </Link>
            </div>
          )}
          <div className="flex flex-1 w-0 -ml-px">
            <a
              target={connected ? "_blank" : "_self"}
              href={href}
              className="relative inline-flex items-center justify-center flex-1 w-0 py-4 text-sm font-medium border border-transparent rounded-br-lg text-neutral-700 dark:text-neutral-300 dark:hover:text-neutral-100 hover:text-gray-500"
              rel="noreferrer"
            >
              <AdjustmentsHorizontalIcon
                className="w-5 h-5"
                aria-hidden="true"
              />
              <span className="ml-3">{connected ? "Manage" : "Connect"}</span>
            </a>
          </div>
        </div>
      </div>
    </li>
  );
}
