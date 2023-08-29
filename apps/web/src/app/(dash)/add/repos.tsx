"use client";

import {
  LockClosedIcon,
  LockOpenIcon,
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Repo } from "@pixeleye/api";
import { Input } from "@pixeleye/ui";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface RepoItemProps {
  repo: Repo;
  handleRepoSelect: (repo: Repo) => void;
}

function RepoItem({ repo, handleRepoSelect }: RepoItemProps) {
  return (
    <li
      key={repo.id}
      className="relative block hover:bg-surface-container-low group"
    >
      <div className="flex items-center px-4 py-4 sm:px-6">
        <div className="flex-1 min-w-0 sm:flex sm:items-center sm:justify-between">
          <div className="truncate">
            <div className="flex items-center text-sm">
              <a
                href={repo.url}
                rel="noopener noreferrer"
                target="_blank"
                className="z-10 flex items-center font-semibold leading-6 text-on-surface hover:underline"
              >
                <span className="mr-1 truncate">{repo.name}</span>
                <ArrowTopRightOnSquareIcon height="1em" width="1em" />
              </a>
              <p className="flex-shrink-0 ml-2 font-normal text-on-surface-variant">
                last updated {dayjs().to(dayjs(repo.lastUpdated))}
              </p>
            </div>
            {repo.description && (
              <div className="flex flex-col mt-2 mr-8">
                <p className="text-xs leading-6 text-on-surface-variant">
                  {repo.description}
                </p>
              </div>
            )}
          </div>
          <div className="flex-shrink-0 mt-4 sm:mt-0 sm:ml-5">
            <span className="bg-surface-container border border-outline-variant rounded-full px-2 py-1 text-sm text-on-surface-variant">
              {repo.private ? "Private" : "Public"}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 ml-5">
          <ChevronRightIcon
            className="w-5 h-5 text-on-surface-variant"
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

interface RepoListProps {
  repos: Repo[];
}

export function RepoList({ repos }: RepoListProps) {
  return (
    <div>

      <div>
        <Input />
        </div>

    <ul className="divide-y divide-surface-container container">
      {repos.map((repo) => (
        <RepoItem
          key={repo.id}
          repo={repo}
          handleRepoSelect={() => undefined}
        />
      ))}
    </ul>
    </div>
  );
}
