import { API } from "@/libs";
import { createQueryKeys } from "@lukemorales/query-key-factory";

export const teamKeys = createQueryKeys("teams", {
  detail: (teamID: string, cookie: string = "") => ({
    queryKey: [teamID],
    contextQueries: {
      listProjects: () => ({
        queryKey: ["projects"],
        queryFn: () =>
          API.get("/teams/{teamID}/projects", {
            headers: { cookie },
            params: { teamID: teamID },
          }),
      }),
      listMembers: () => ({
        queryKey: ["members"],
        queryFn: () =>
          API.get("/teams/{teamID}/users", {
            headers: { cookie },
            params: { teamID: teamID },
          }),
        contextQueries: {
          invited: () => ({
            queryKey: ["invited"],
            queryFn: () =>
              API.get("/teams/{teamID}/users", {
                headers: { cookie },
                params: { teamID: teamID },
              }).then((res) => res.filter((user) => user.type === "invited")),
          }),
          git: () => ({
            queryKey: ["git"],
            queryFn: () =>
              API.get("/teams/{teamID}/users", {
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
      API.get("/user/teams", {
        headers: {
          ...(cookie ? { cookie } : {}),
        },
      }),
  }),
});
