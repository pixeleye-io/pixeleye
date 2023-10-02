import { API } from "@/libs";
import { createQueryKeys } from "@lukemorales/query-key-factory";

export const inviteKeys = createQueryKeys("invites", {
  detail: (inviteID: string, cookie: string = "") => ({
    queryKey: [inviteID],
    queryFn: () =>
      API.get("/invites/{id}", {
        headers: { cookie },
        params: { id: inviteID },
      }),
    contextQueries: {
      accept: () => ({
        queryKey: ["accept"],
        queryFn: () =>
          API.post("/invites/{id}/accept", {
            headers: { cookie },
            params: { id: inviteID },
          }),
      }),
    },
  }),
});
