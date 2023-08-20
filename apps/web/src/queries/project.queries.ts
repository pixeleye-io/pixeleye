import { API } from "@/libs";
import { createQueryKeys } from "@lukemorales/query-key-factory";

export const projectKeys = createQueryKeys("projects", {
  detail: (projectID: string, cookie: string = "") => ({
    queryKey: [projectID],
    queryFn: () =>
      API.get("/projects/{id}", {
        headers: { cookie },
        params: { id: projectID },
      }),
    contextQueries: {
      listBuilds: () => ({
        queryKey: ["builds"],
        queryFn: () =>
          API.get("/projects/{id}/builds", {
            headers: { cookie },
            params: { id: projectID },
          }),
      }),
    },
  }),
});
