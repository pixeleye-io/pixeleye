"use client";

import { API } from "@/libs";
import { useKeyStore } from "@/stores/apiKeyStore";
import {
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Project, Repo, Team } from "@pixeleye/api";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@pixeleye/ui";
import { InputBase } from "@pixeleye/ui/src/input";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "next/navigation";
import router from "next/router";
import { useDeferredValue, useMemo, useState } from "react";

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
  team: Team;
  source: Project["source"];
}

export function RepoList({ repos, team, source }: RepoListProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "lastUpdated">("lastUpdated");

  const router = useRouter();

  const setKey = useKeyStore((state) => state.setKey);

  const deferredSearch = useDeferredValue(search);

  const filteredRepos = useMemo(() => {
    if (!deferredSearch) return repos;
    return repos.filter((repo) =>
      repo.name.toLowerCase().includes(deferredSearch.toLowerCase())
    );
  }, [deferredSearch, repos]);

  const sortedRepos = useMemo(() => {
    if (sort === "name") {
      return filteredRepos.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      return filteredRepos.sort((a, b) =>
        dayjs(a.lastUpdated).isBefore(dayjs(b.lastUpdated)) ? 1 : -1
      );
    }
  }, [filteredRepos, sort]);

  const { mutate: createProject } = useMutation({
    mutationFn: (repo: Repo) => {
      return API.post("/teams/{teamID}/projects", {
        body: {
          name: repo.name,
          source,
          sourceID: repo.id,
          url: repo.url,
        },
        params: {
          teamID: team?.id ?? "",
        },
      })
    },
    onSuccess: (project) => {
        setKey(project.id, project.token!);
        router.push(`/projects/${project.id}`);
      },
  });

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <div className="flex items-center justify-end space-x-4 my-8 ">
        <InputBase
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Find a repository..."
          aria-label="Search for repo names"
          className="max-w-md"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Sort</Button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent>
              <DropdownMenuLabel>Select order</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={sort}
                onValueChange={setSort as any}
              >
                <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="lastUpdated">
                  Last updated
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      </div>
      {sortedRepos.length === 0 && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-on-surface-variant">
            No repositories found. Try a different search.
          </p>
        </div>
      )}
      {sortedRepos.length > 0 && (
        <ul className="divide-y divide-surface-container rounded border border-outline-variant ">
          {sortedRepos.map((repo) => (
            <RepoItem
              key={repo.id}
              repo={repo}
              handleRepoSelect={() => createProject(repo)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
