interface Repo {
  name: string;
  url: string;
}

export interface GitProvider {
  getRepos: () => Promise<Repo[]>;
}
