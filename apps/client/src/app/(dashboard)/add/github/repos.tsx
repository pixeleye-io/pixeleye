"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
  LockClosedIcon,
  LockOpenIcon,
} from "@heroicons/react/24/solid";
import { Modal, Spinner } from "@pixeleye/ui";
import { useQueryClient } from "@tanstack/react-query";
import Avatar from "~/components/avatar";
import { api } from "~/lib/api";
import { API_SECRET } from "../../project/[id]/token";
import { Repos } from "./services";

type Repo = Repos["repos"][0];

interface RepoItemProps {
  repo: Repo;
  handleRepoSelect: (repo: Repo) => void;
}

function RepoItem({ repo, handleRepoSelect }: RepoItemProps) {
  return (
    <li
      key={repo.id}
      className="relative block hover:bg-gray-50 dark:hover:bg-gray-850 group"
    >
      <div className="flex items-center px-4 py-4 sm:px-6">
        <div className="flex-1 min-w-0 sm:flex sm:items-center sm:justify-between">
          <div className="truncate">
            <div className="flex items-center text-sm">
              {repo.private !== undefined && (
                <>
                  {repo.private ? (
                    <LockClosedIcon
                      className="flex-shrink-0 mr-1.5 text-gray-900 dark:text-white"
                      aria-label="private repo"
                      height="1em"
                      width="1em"
                    />
                  ) : (
                    <LockOpenIcon
                      className="flex-shrink-0 mr-1.5 text-gray-900 dark:text-white"
                      aria-label="public repo"
                      height="1em"
                      width="1em"
                    />
                  )}
                </>
              )}
              <a
                href={repo.url}
                rel="noopener noreferrer"
                target="_blank"
                className="z-10 flex items-center font-medium text-gray-900 truncate dark:text-white hover:underline"
              >
                <span className="mr-1 truncate">{repo.name}</span>
                <ArrowTopRightOnSquareIcon height="1em" width="1em" />
              </a>
              <p className="flex-shrink-0 ml-2 font-normal text-gray-700 dark:text-gray-500">
                last updated {repo.lastUpdated}
              </p>
            </div>
            <div className="flex flex-col mt-4 mr-8">
              <p className="text-sm text-gray-700 truncate dark:text-gray-500">
                {repo.description}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 mt-4 sm:mt-0 sm:ml-5">
            <div className="flex -space-x-1 overflow-hidden">
              {repo.contributors.map((contributor) => (
                <Avatar
                  key={contributor.id}
                  name={contributor.name}
                  src={contributor.avatar}
                  className="ring ring-white dark:ring-gray-900 group-hover:ring-gray-50 dark:group-hover:ring-gray-850"
                  size="sm"
                />
              ))}
              {repo.contributorsCount > 4 && (
                <Avatar
                  title={`${repo.contributorsCount - 4} more`}
                  name={"+"}
                  className="ring ring-white dark:ring-gray-900 group-hover:ring-gray-50 dark:group-hover:ring-gray-850"
                  size="sm"
                />
              )}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 ml-5">
          <ChevronRightIcon
            className="w-5 h-5 text-gray-400"
            aria-hidden="true"
          />
        </div>
      </div>
      <button
        className="absolute inset-0 w-full h-full"
        onClick={() => handleRepoSelect(repo)}
      >
        <span className="sr-only">Import repository</span>
      </button>
    </li>
  );
}

interface ReposProps {
  repos: Repos["repos"];
  teamId: string;
  installId: string;
}

export function RepoList({ repos, teamId, installId }: ReposProps) {
  const [selected, setSelected] = useState<Repo | null>(null);
  const [existing, setExisting] = useState<Repo | null>(null);

  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: createProject } = api.project.createProject.useMutation({
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData([API_SECRET, data.id], data.secret);
        router.push(`/project/${data.id}`);
      }
    },
  });

  const handleSelect = (repo: Repo) => {
    if (repo.exists) {
      setExisting(repo);
      return;
    }
    setSelected(repo);
    createProject({
      name: repo.name,
      url: repo.url,
      teamId,
      github: {
        gitId: repo.id.toString(),
        installId,
      },
      type: "GITHUB",
    });
  };

  return (
    <>
      <ul
        role="list"
        className="overflow-hidden border border-gray-200 divide-y divide-gray-200 rounded-lg dark:border-gray-800 dark:divide-gray-800"
      >
        {repos.map((repo) => (
          <RepoItem key={repo.id} repo={repo} handleRepoSelect={handleSelect} />
        ))}
      </ul>
      <Modal
        disableOutsideClick
        title={`Importing ${selected?.name || ""}`}
        description="This won't take long."
        open={selected !== null && existing === null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <div className="flex items-center justify-center my-12 w-72">
          <Spinner className="text-5xl" loading={true} />
        </div>
      </Modal>
      <Modal
        title={`${existing?.name || ""} already exists`}
        description="There's already a project for this repo. Do you want to import it again?"
        open={existing !== null}
        onOpenChange={(open) => {
          if (!open) setExisting(null);
        }}
      >
        <Modal.Footer>
          <Modal.Button close>Close</Modal.Button>
          <Modal.Button
            onClick={() => {
              existing!.exists = false;
              handleSelect(existing!);
              setExisting(null);
            }}
          >
            Import
          </Modal.Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
