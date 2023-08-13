"use client";

import { API } from "@/libs/api";
import { Button } from "@pixeleye/ui";
import { useKeyStore } from "@/stores/apiKeyStore";
import { useRouter } from "next/navigation";
import { useTeam } from "@/libs/useTeam";

export default function AddProjectPage() {
  const { setKey } = useKeyStore();
  const router = useRouter();

  const { team } = useTeam();

  return (
    <div>
      <h1>Add Project</h1>
      <Button
        onClick={() => {
          API.post("/teams/{teamID}/projects", {
            body: {
              name: "Test",
              source: "custom",
            },
            params: {
              teamID: team?.id ?? "",
            },
          }).then((project) => {
            setKey(project.id, project.token!);
            router.push(`/projects/${project.id}`);
          });
        }}
      >
        Test
      </Button>
    </div>
  );
}
