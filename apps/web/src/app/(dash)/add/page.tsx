"use client";

import { API } from "@pixeleye/api";
import { Button } from "@pixeleye/ui";
import { useKeyStore } from "@/stores/apiKeyStore";
import { useRouter } from "next/navigation";

export default function AddProjectPage() {
  const { setKey } = useKeyStore();
  const router = useRouter();
  return (
    <div>
      <h1>Add Project</h1>
      <Button
        onClick={() => {
          API.post("/projects", {
            body: {
              name: "Test",
              source: "github" as any,
              sourceID: "32960904",
            },
          }).then((project) => {
            setKey(project.id, project.token);
            router.push(`/projects/${project.id}`);
          });
        }}
      >
        Test
      </Button>
    </div>
  );
}
