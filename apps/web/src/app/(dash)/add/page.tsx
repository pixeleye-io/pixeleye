import Image from "next/image";
import { cx } from "class-variance-authority";
import Link from "next/link";

interface ImportCardProps {
  name: string;
  connected?: boolean;
  imageUrl: {
    light: string;
    dark: string;
  };
}

const sources: ImportCardProps[] = [
  {
    name: "github",
    connected: true,
    imageUrl: {
      light: "/github-mark.svg",
      dark: "/github-mark-white.svg",
    },
  },
  {
    name: "basic git",
    connected: false,
    imageUrl: {
      light: "/git.svg",
      dark: "/git-white.svg",
    },
  },
];

export default function AddProjectPage() {
  return (
    <div className="p-16">
      <ul className="flex gap-8 justify-center flex-wrap">
        {sources.map((source) => (
          <li key={source.name}>
            <div className="relative w-56 p-4 text-center border rounded-lg shadow border-outline-variant hover:bg-surface-container-low transition">
              <Image
                width={128}
                height={128}
                className="flex-shrink-0 w-32 h-32 mx-auto rounded-full dark:hidden"
                src={source.imageUrl.light}
                alt={`${source.name} logo`}
              />
              <Image
                width={128}
                height={128}
                className="flex-shrink-0 hidden w-32 h-32 mx-auto rounded-full dark:block"
                src={source.imageUrl.dark}
                alt={`${source.name} logo`}
              />
              <h3 className="mt-4 text-lg">{source.name}</h3>

              <span
                className={cx(
                  "px-2 py-1 text-xs font-medium rounded-full",
                  source.connected
                    ? "text-green-800 bg-green-100"
                    : "text-amber-800 bg-amber-100"
                )}
              >
                {source.connected ? "Connected" : "Not connected"}
              </span>
              <Link
                href={`/add/${source.name}`}
                className="absolute inset-0 w-full h-full"
              >
                <span className="sr-only">
                  Import project from {source.name}
                </span>
                <span className="inset-0 w-full h-full" />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
