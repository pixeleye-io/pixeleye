"use client";

import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Button, Container } from "@pixeleye/ui";
import * as Dialog from "@radix-ui/react-dialog";
import { cx } from "class-variance-authority";
import { api } from "~/utils/api";

interface ImportCardProps {
  name: string;
  connected?: boolean;
  imageUrl: {
    light: string;
    dark: string;
  };
}
function ImportCard({ name, connected, imageUrl }: ImportCardProps) {
  const { data: installs } = api.github.getInstallations.useQuery();

  const installationId = (installs && installs[0]?.id) || 0;

  const { data: repos } = api.github.getRepositories.useQuery(
    {
      installationId,
    },
    { enabled: Boolean(installationId) },
  );

  if (connected) console.log("repos", repos);
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

      <Dialog.Root>
        <Dialog.Trigger asChild>
          <button disabled={!connected}>
            <span className="absolute inset-0" />
            <span className="sr-only">Open {name}</span>
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/25 backdrop-blur-sm " />
          <Dialog.Content className="fixed p-4 -translate-x-1/2 -translate-y-1/2 bg-white border rounded-md dark:bg-black top-1/2 left-1/2 border-neutral-300 dark:border-neutral-700">
            <Dialog.Title className="DialogTitle">Select Repo</Dialog.Title>
            <Dialog.Description className="DialogDescription">
              Select a repo to import
            </Dialog.Description>
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
                  <Button>Import</Button>
                </li>
              ))}
            </ul>
            <div
              style={{
                display: "flex",
                marginTop: 25,
                justifyContent: "flex-end",
              }}
            >
              <Dialog.Close asChild>
                <button className="Button green">Save changes</button>
              </Dialog.Close>
            </div>
            <Dialog.Close asChild>
              <button className="IconButton" aria-label="Close">
                <XMarkIcon />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

const sources: ImportCardProps[] = [
  {
    name: "Github",
    connected: true,
    imageUrl: {
      light: "/github-mark.svg",
      dark: "/github-mark-white.svg",
    },
  },
  {
    name: "Gitlab",
    connected: false,
    imageUrl: {
      light: "/gitlab-logo.svg",
      dark: "/gitlab-logo-white.svg",
    },
  },
  {
    name: "Bitbucket",
    connected: false,
    imageUrl: {
      light: "/github-mark.svg",
      dark: "/github-mark-white.svg",
    },
  },
  {
    name: "Other",
    connected: false,
    imageUrl: {
      light: "/github-mark.svg",
      dark: "/github-mark-white.svg",
    },
  },
];

export default function AddPage() {
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
              <ImportCard key={source.name} {...source} />
            ))}
          </div>
        ))}
      </Container>
    </>
  );
}
