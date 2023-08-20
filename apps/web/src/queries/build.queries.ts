import { API } from "@/libs";
import { createQueryKeys } from "@lukemorales/query-key-factory";

export const buildKeys = createQueryKeys("builds", {
  detail: (buildID: string, cookie: string = "") => ({
    queryKey: [buildID],
    queryFn: () =>
      API.get("/builds/{id}", {
        headers: { cookie },
        params: { id: buildID },
      }),
  }),
});
