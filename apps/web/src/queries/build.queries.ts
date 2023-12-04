import { API } from "@/libs";
import { createQueryKeys } from "@lukemorales/query-key-factory";

export const buildKeys = createQueryKeys("builds", {
  detail: (buildID: string, cookie: string = "") => ({
    queryKey: [buildID],
    queryFn: () =>
      API.get("/v1/builds/{id}", {
        headers: { cookie },
        params: { id: buildID },
      }),
    contextQueries: {
      listSnapshots: () => ({
        queryKey: ["snapshots"],
        queryFn: () =>
          API.get("/v1/builds/{id}/snapshots", {
            headers: { cookie },
            params: { id: buildID },
          }),
      }),
      abort: () => ({
        queryKey: ["abort"],
        queryFn: () =>
          API.post("/v1/builds/{id}/review/abort", {
            headers: { cookie },
            params: { id: buildID },
          }),
      }),
    },
  }),
});
