interface Contributor {
  name: string;
  avatar?: string;
  id: string;
}

interface Owner {
  name: string;
  avatar: string;
  url: string;
}

interface Repo {
  name: string;
  url: string;
  id: string;
  contributors: Contributor[];
  description: string;
  lastUpdated: string;
}

export interface GitProvider {
  listRepos: () => Promise<{
    owner: Owner;
    repos: Repo[];
  }>;
}
