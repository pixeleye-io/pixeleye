import { API } from "@/libs";
import { createQueryKeys } from "@lukemorales/query-key-factory";
import { Services } from "@pixeleye/api";

export const userKeys = createQueryKeys("user", {
  get: (cookie: string = "") => ({
    queryKey: ["get"],
    queryFn: () =>
      API.get("/v1/user/me", {
        headers: {
          cookie,
        },
      }),
  }),
  update: (cookie: string = "") => ({
    queryKey: ["update"],
    queryFn: (user: Services["PATCH"]["/v1/user/me"]["req"]) =>
      API.patch("/v1/user/me", {
        headers: {
          cookie,
        },
        body: user,
      }),
  }),
});
