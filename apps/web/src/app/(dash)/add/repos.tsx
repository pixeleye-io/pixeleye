"use client";

import { API } from "@/libs";
import { useKeyStore } from "@/stores/apiKeyStore";
import {
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
  ArrowPathIcon,
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
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";

dayjs.extend(relativeTime);

interface RepoItemProps {
  repo: Repo;
  isLoading?: boolean;
  isDisabled?: boolean;
  handleRepoSelect: (repo: Repo) => void;
}

function RepoItem({ repo, handleRepoSelect, isLoading, isDisabled }: RepoItemProps) {
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
              {repo.lastUpdated && (
                <p className="flex-shrink-0 ml-2 font-normal text-on-surface-variant">
                  last updated {dayjs().to(dayjs(repo.lastUpdated))}
                </p>
              )}
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
          {
            isLoading ? (
              <ArrowPathIcon
                className="w-5 h-5 text-on-surface-variant animate-spin"
                aria-hidden="true"
              />
            ) : (
              <ChevronRightIcon
                className="w-5 h-5 text-on-surface-variant"
                aria-hidden="true"
              />
            )
          }
        </div>
      </div>
      <button
        disabled={isDisabled}
        className="absolute inset-0 w-full h-full"
        onClick={() => handleRepoSelect(repo)}
      >
        <span className="sr-only">Import repository</span>
      </button>
    </li>
  );
}

interface RepoListProps {
  initialRepos: Repo[];
  initialNext: string;
  team: Team;
  source: Project["source"];
}

// Bitbucket (both Cloud and Server) filter repos server-side by name/project, since a
// workspace/instance can have thousands of repos - loading them all up front (and only
// filtering client-side) doesn't scale. GitHub still returns everything in one page, so
// its project filter input is hidden and search only narrows what's already loaded.
const SERVER_SIDE_FILTERED_SOURCES: Project["source"][] = ["bitbucket", "bitbucket_server"];

export function RepoList({ initialRepos, initialNext, team, source }: RepoListProps) {
  const [search, setSearch] = useState("");
  const [project, setProject] = useState("");
  const [sort, setSort] = useState<"name" | "lastUpdated">("name");

  const deferredSearch = useDeferredValue(search);
  const deferredProject = useDeferredValue(project);

  const supportsServerFilter = SERVER_SIDE_FILTERED_SOURCES.includes(source);

  const router = useRouter();

  const setKey = useKeyStore((state) => state.setKey);

  const isInitialFilter = !deferredSearch && !deferredProject;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["repos", team.id, supportsServerFilter ? deferredSearch : "", supportsServerFilter ? deferredProject : ""],
    queryFn: ({ pageParam }) => {
      // api-typify builds a URLSearchParams straight from this object, which stringifies an
      // `undefined` value to the literal text "undefined" rather than omitting the key - so
      // only ever include keys that have a real value.
      const queries: { q?: string; project?: string; next?: string } = {};
      if (supportsServerFilter && deferredSearch) queries.q = deferredSearch;
      if (supportsServerFilter && deferredProject) queries.project = deferredProject;
      if (pageParam) queries.next = pageParam;

      return API.get("/v1/teams/{teamID}/repos", {
        params: { teamID: team.id },
        queries,
      });
    },
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.next || undefined,
    initialData:
      isInitialFilter || !supportsServerFilter
        ? { pages: [{ repos: initialRepos, next: initialNext }], pageParams: [""] }
        : undefined,
  });

  const fetchedRepos = useMemo(
    () => data?.pages.flatMap((page) => page.repos) ?? [],
    [data]
  );

  // GitHub always returns everything in one page - keep client-side search for it so typing
  // still narrows results instead of only relying on (nonexistent) server filtering.
  const filteredRepos = useMemo(() => {
    if (supportsServerFilter || !deferredSearch) return fetchedRepos;
    return fetchedRepos.filter((repo) =>
      repo.name.toLowerCase().includes(deferredSearch.toLowerCase())
    );
  }, [fetchedRepos, deferredSearch, supportsServerFilter]);

  const sortedRepos = useMemo(() => {
    // Bitbucket's repo-listing APIs already return results in alphabetical order, and
    // pages are fetched in that same order - re-sorting client-side on every "load more"
    // is both redundant and was the actual cause of items appearing to jump to the top (a
    // comparator that returns a fixed value for equal inputs isn't a valid sort order, and
    // effectively reverses the array on each resort). Trust server order for Bitbucket;
    // only sort client-side for GitHub, which returns everything in one page anyway.
    if (supportsServerFilter && sort === "name") {
      return filteredRepos;
    }

    const copy = [...filteredRepos];
    if (sort === "name") {
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      return copy.sort((a, b) => {
        if (!a.lastUpdated && !b.lastUpdated) return 0;
        if (!a.lastUpdated) return 1;
        if (!b.lastUpdated) return -1;
        return dayjs(b.lastUpdated).valueOf() - dayjs(a.lastUpdated).valueOf();
      });
    }
  }, [filteredRepos, sort, supportsServerFilter]);

  const { mutate: createProject, context, isPending } = useMutation({
    mutationFn: (repo: Repo) => {
      return API.post("/v1/teams/{teamID}/projects", {
        body: {
          name: repo.name,
          source,
          sourceID: repo.id,
          url: repo.url,
          autoApprove: repo.defaultBranch ? `^${repo.defaultBranch}$` : undefined,
          snapshotBlur: false,
          snapshotThreshold: 0.05,
        },
        params: {
          teamID: team?.id ?? "",
        },
      })
    },
    onMutate: (repo: Repo) => repo,
    onSuccess: (project) => {
      setKey(project.id, project.token!);
      router.push(`/projects/${project.id}`);
    },
  });



  return (
    <div className="max-w-4xl mx-auto pb-8">
      <div className="flex flex-wrap items-center justify-end gap-4 my-8">
        <InputBase
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Find a repository..."
          aria-label="Search for repo names"
          className="max-w-md"
        />
        {supportsServerFilter && (
          <InputBase
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="Filter by project key..."
            aria-label="Filter by project key"
            className="max-w-xs"
          />
        )}
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
      {isLoading && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-on-surface-variant">Loading repositories...</p>
        </div>
      )}
      {!isLoading && sortedRepos.length === 0 && (
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
              isLoading={context?.id === repo.id && isPending}
              isDisabled={context?.id !== repo.id && isPending}
              handleRepoSelect={() => createProject(repo)}
            />
          ))}
        </ul>
      )}
      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            loading={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
