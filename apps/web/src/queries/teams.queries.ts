import { API } from "@/libs";
import { createQueryKeys } from "@lukemorales/query-key-factory";

export const teamKeys = createQueryKeys("teams", {
  detail: (teamID: string, cookie: string = "") => ({
    queryKey: [teamID],
    contextQueries: {
      listProjects: () => ({
        queryKey: ["projects"],
        queryFn: () =>
          API.get("/v1/teams/{teamID}/projects", {
            headers: { cookie },
            params: { teamID: teamID },
          }),
      }),
      getSnapshotUsage: (queries: { from: string; to: string }) => ({
        queryKey: ["snapshotUsage"],
        queryFn: () =>
          API.get("/v1/teams/{teamID}/usage/snapshots", {
            headers: { cookie },
            params: { teamID: teamID },
            queries,
          }),
      }),
      getBuildUsage: (queries: { from: string; to: string }) => ({
        queryKey: ["buildUsage"],
        queryFn: () =>
          API.get("/v1/teams/{teamID}/usage/builds", {
            headers: { cookie },
            params: { teamID: teamID },
            queries,
          }),
      }),
      listMembers: () => ({
        queryKey: ["members"],
        queryFn: () =>
          API.get("/v1/teams/{teamID}/users", {
            headers: { cookie },
            params: { teamID: teamID },
          }),
        contextQueries: {
          invited: () => ({
            queryKey: ["invited"],
            queryFn: () =>
              API.get("/v1/teams/{teamID}/users", {
                headers: { cookie },
                params: { teamID: teamID },
              }).then((res) => res.filter((user) => user.type === "invited")),
          }),
          git: () => ({
            queryKey: ["git"],
            queryFn: () =>
              API.get("/v1/teams/{teamID}/users", {
                headers: { cookie },
                params: { teamID: teamID },
              }).then((res) => res.filter((user) => user.type === "git")),
          }),
        },
      }),
    },
  }),

  list: (cookie?: string) => ({
    queryKey: [{}],
    queryFn: () =>
      API.get("/v1/user/teams", {
        headers: {
          ...(cookie ? { cookie } : {}),
        },
      }),
  }),
});
