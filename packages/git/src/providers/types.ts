interface Contributor {
  name: string;
  avatar?: string;
  id: string;
}

interface Repo {
  name: string;
  url: string;
  id: string;
  contributors: Contributor[];
}

export interface GitProvider {
  listRepos: () => Promise<Repo[]>;
}
