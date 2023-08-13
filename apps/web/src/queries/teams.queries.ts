import { API } from "@/libs";
import { createQueryKeys } from "@lukemorales/query-key-factory";

export const teamKeys = createQueryKeys("teams", {
  detail: (teamID: string, cookie: string = "") => ({
    queryKey: [teamID],
    contextQueries: {
      list: () => ({
        queryKey: ["projects"],
        queryFn: () =>
          API.get("/teams/{teamID}/projects", {
            headers: { cookie },
            params: { teamID: teamID },
          }),
      }),
    },
  }),

  list: (cookie?: string) => ({
    queryKey: [{}],
    queryFn: () =>
      API.get("/user/teams", {
        headers: {
          ...(cookie ? {cookie} : {}),
        },
      }),
  }),
});
