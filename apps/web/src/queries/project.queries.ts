import { API } from "@/libs";
import { createQueryKeys } from "@lukemorales/query-key-factory";
import { UserOnProjectRole } from "@pixeleye/api";

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
      listMembers: () => ({
        queryKey: ["members"],
        queryFn: () =>
          API.get("/projects/{id}/users", {
            headers: { cookie },
            params: { id: projectID },
          }),
        contextQueries: {
          invited: () => ({
            queryKey: ["invited"],
            queryFn: () =>
              API.get("/projects/{id}/users", {
                headers: { cookie },
                params: { id: projectID },
              }).then((res) => res.filter((user) => user.type === "invited")),
          }),
          git: () => ({
            queryKey: ["git"],
            queryFn: () =>
              API.get("/projects/{id}/users", {
                headers: { cookie },
                params: { id: projectID },
              }).then((res) => res.filter((user) => user.type === "git")),
          }),
          updateRole: (userID: string) => ({
            queryKey: [userID, "updateRole"],
            queryFn: (role: UserOnProjectRole) =>
              API.patch("/projects/{id}/admin/users/{userID}", {
                headers: { cookie },
                params: { id: projectID, userID },
                body: { role },
              }),
          }),
        },
      }),
    },
  }),
});
