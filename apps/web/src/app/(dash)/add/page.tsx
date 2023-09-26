import Image from "next/image";
import { cx } from "class-variance-authority";
import Link from "next/link";
import { useTeamStore } from "../breadcrumbStore";
import { getTeam } from "@/serverLibs";
import { redirect } from "next/navigation";
import { API } from "@/libs";
import { cookies } from "next/headers";
import { env } from "@/env";

interface ImportCardProps {
  name: string;
  connected?: boolean;
  installUrl?: string;
  type: string;
  imageUrl: {
    light: string;
    dark: string;
  };
}

const defaultSources: ImportCardProps[] = [
  {
    name: "Github",
    type: "github",
    installUrl: `https://github.com/apps/${env.GITHUB_APP_NAME}/installations/new`,
    connected: false,
    imageUrl: {
      light: "/github-mark.svg",
      dark: "/github-mark-white.svg",
    },
  },
  {
    name: "Generic git",
    type: "custom",
    connected: true,
    imageUrl: {
      light: "/git.svg",
      dark: "/git-white.svg",
    },
  },
];

export default async function AddProjectPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const params = new URLSearchParams(searchParams);

  const team = await getTeam(searchParams);

  if (team.type !== "user") redirect(`/add/${team.type}?${params.toString()}`);

  const installations = await API.get("/teams/{teamID}/installations", {
    params: {
      teamID: team.id,
    },
    headers: {
      cookie: cookies().toString(),
    },
  });

  const sources = defaultSources.map((source) => {
    const installation = installations.find(
      (installation) => installation.type === source.type
    );

    if (installation) {
      return {
        ...source,
        connected: true,
      };
    }
    return source;
  });

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
                href={
                  source.connected
                    ? `/add/${source.type}?${params.toString()}`
                    : source.installUrl!
                }
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
