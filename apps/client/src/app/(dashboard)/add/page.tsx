"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button, Container, Modal } from "@pixeleye/ui";
import { cx } from "class-variance-authority";
import { api } from "~/utils/api";

interface ImportCardProps {
  name: SourceName;
  onClick?: () => void;
  connected?: boolean;
  imageUrl: {
    light: string;
    dark: string;
  };
}
function ImportCard({ name, connected, imageUrl, onClick }: ImportCardProps) {
  return (
    <div className="relative w-56 p-4 text-center border rounded-lg shadow border-neutral-300 dark:border-neutral-700">
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
      <h3 className="mt-4 text-lg">{name}</h3>

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
      <button onClick={onClick} className="absolute inset-0 w-full h-full">
        <span className="sr-only">Import project from {name}</span>
        <span className="inset-0 w-full h-full" />
      </button>
    </div>
  );
}

function GithubModal() {
  const { data: installs } = api.github.getInstallations.useQuery();

  const installationId = (installs && installs[0]?.id) || 0;

  const { data: repos } = api.github.getRepositories.useQuery(
    {
      installationId,
    },
    { enabled: Boolean(installationId) },
  );

  const { mutateAsync: createProject, isLoading } =
    api.project.createUserProject.useMutation();

  console.log(isLoading);

  return (
    <ul
      role="list"
      className="overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800  max-h-[30rem]"
    >
      {repos?.map((repo) => (
        <li key={repo.name} className="flex justify-between py-4">
          <div className="ml-3">
            <p className="text-sm font-medium text-black dark:text-white">
              {repo.name}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-300">
              {repo.url}
            </p>
          </div>
          <Button
            disabled={isLoading}
            onClick={() =>
              createProject({
                name: repo.name,
                url: repo.html_url,
                type: "GITHUB",
                githubInstallId: installationId,
              })
            }
          >
            Import
          </Button>
        </li>
      ))}
    </ul>
  );
}

const sources: Omit<ImportCardProps, "onClick">[] = [
  {
    name: "github",
    connected: true,
    imageUrl: {
      light: "/github-mark.svg",
      dark: "/github-mark-white.svg",
    },
  },
  {
    name: "gitlab",
    connected: false,
    imageUrl: {
      light: "/gitlab-logo.svg",
      dark: "/gitlab-logo-white.svg",
    },
  },
  {
    name: "bitbucket",
    connected: false,
    imageUrl: {
      light: "/github-mark.svg",
      dark: "/github-mark-white.svg",
    },
  },
  {
    name: "other",
    connected: false,
    imageUrl: {
      light: "/github-mark.svg",
      dark: "/github-mark-white.svg",
    },
  },
];

type SourceName = "github" | "gitlab" | "bitbucket" | "other";

const sourceNames = ["github", "gitlab", "bitbucket", "other"] as SourceName[];

export default function AddPage() {
  const query = useSearchParams().get("source") || "";
  const [selected, setSelected] = useState<SourceName | undefined>(
    sourceNames.includes(query as SourceName)
      ? (query as SourceName)
      : undefined,
  );
  const sourcesGrouped = sources.reduce(
    (accumulator, currentValue, currentIndex, array) => {
      if (currentIndex % 2 === 0) {
        accumulator.push(array.slice(currentIndex, currentIndex + 2));
      }
      return accumulator;
    },
    [] as ImportCardProps[][],
  );
  return (
    <>
      <Container className="py-12">
        <h1 className="text-4xl">Add project</h1>
        <p>setup a new project by selecting an option below</p>
      </Container>
      <Container className="flex flex-wrap items-center justify-center gap-8">
        {sourcesGrouped.map((source) => (
          <div
            key={source.reduce((acc, { name }) => acc + name, "")}
            className="flex flex-wrap items-center justify-center gap-8"
          >
            {source.map((source) => (
              <ImportCard
                onClick={() => setSelected(source.name)}
                key={source.name}
                {...source}
              />
            ))}
          </div>
        ))}
      </Container>
      <Modal
        onOpenChange={(open) => {
          if (!open) setSelected(undefined);
        }}
        open={Boolean(selected)}
        title="Import project"
        description="Select repo to import from"
      >
        {selected === "github" && <GithubModal />}
        <Modal.Footer>
          <Modal.Button close>Close</Modal.Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
