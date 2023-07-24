"use client";

import API from "@pixeleye/api";
import { Button } from "@pixeleye/ui";

export default function AddProjectPage() {
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
          });
        }}
      >
        Test
      </Button>
    </div>
  );
}
