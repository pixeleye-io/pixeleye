import { API } from "@/libs";
import { createQueryKeys } from "@lukemorales/query-key-factory";
import { UserAPI } from "@pixeleye/api/src/services/user";

export const userKeys = createQueryKeys("user", {
  get: (cookie: string = "") => ({
    queryKey: ["get"],
    queryFn: () =>
      API.get("/user/me", {
        headers: {
          cookie,
        },
      }),
  }),
  update: (cookie: string = "") => ({
    queryKey: ["update"],
    queryFn: (user: UserAPI["PATCH"]["/user/me"]["req"]) =>
      API.patch("/user/me", {
        headers: {
          cookie,
        },
        body: user,
      }),
  }),
});
