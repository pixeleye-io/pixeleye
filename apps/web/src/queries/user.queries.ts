import { API } from "@/libs";
import { createQueryKeys } from "@lukemorales/query-key-factory";

export const userKeys = createQueryKeys("user", {
  me: (cookie: string = "") => ({
    queryKey: ["me"],
    queryFn: () =>
      API.get("/user/me", {
        headers: {
          cookie,
        },
      }),
  }),
});
