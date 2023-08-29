"use client"

import {
  LockClosedIcon,
  LockOpenIcon,
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Repo } from "@pixeleye/api";

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
              {repo.private !== undefined && (
                <>
                  {repo.private ? (
                    <LockClosedIcon
                      className="flex-shrink-0 mr-1.5 text-on-surface"
                      aria-label="private repo"
                      height="1em"
                      width="1em"
                    />
                  ) : (
                    <LockOpenIcon
                      className="flex-shrink-0 mr-1.5 text-on-surface"
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
                className="z-10 flex items-center font-medium text-on-surface hover:underline"
              >
                <span className="mr-1 truncate">{repo.name}</span>
                <ArrowTopRightOnSquareIcon height="1em" width="1em" />
              </a>
              <p className="flex-shrink-0 ml-2 font-normal text-on-surface-variant">
                last updated {repo.lastUpdated}
              </p>
            </div>
            <div className="flex flex-col mt-4 mr-8">
              <p className="text-sm text-on-surface-variant">
                {repo.description}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 mt-4 sm:mt-0 sm:ml-5">
            <div className="flex -space-x-1 overflow-hidden">
              {/* {repo.contributors?.slice(0, 4).map((contributor) => (
                <></>
                //   <Avatar
                //     key={contributor.id}
                //     name={contributor.name}
                //     src={contributor.avatar}
                //     className="ring ring-white dark:ring-gray-900 group-hover:ring-gray-50 dark:group-hover:ring-gray-850"
                //     size="sm"
                //   />
              ))}
              {(repo.contributorCount ?? repo.contributors?.length ?? 0) >
                4 && (
                <></>
                // <Avatar
                //   title={`${repo.contributorsCount - 4} more`}
                //   name={"+"}
                //   className="ring ring-white dark:ring-gray-900 group-hover:ring-gray-50 dark:group-hover:ring-gray-850"
                //   size="sm"
                // />
              )} */}
            </div>
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
        <ul className="divide-y divide-surface-container">
            {repos.map((repo) => (
                <RepoItem key={repo.id} repo={repo} handleRepoSelect={() => undefined} />
            ))}
        </ul>
    );
}