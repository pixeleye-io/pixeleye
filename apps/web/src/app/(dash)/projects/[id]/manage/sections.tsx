"use client";

import { useKeyStore } from "@/stores/apiKeyStore";
import { KeyIcon } from "@heroicons/react/24/outline";
import { API } from "@/libs";
import { Button } from "@pixeleye/ui";
import { InputBase } from "@pixeleye/ui/src/input";

export function SecuritySection({ id }: { id: string }) {
  const setKey = useKeyStore((state) => state.setKey);
  const apiKey = useKeyStore((state) => state.keys[id]);

  return (
    <div className="flex space-x-4 rounded-md border border-outline-variant p-4 overflow-hidden">
      <div className="flex flex-col max-w-[10rem] items-center space-between">
        <KeyIcon className="w-12 h-12 text-on-surface-variant" />
        <p className="rounded-full border border-outline-variant whitespace-nowrap text-xs px-2 py-1">
          API key
        </p>
      </div>
      <div className="flex flex-col justify-around flex-1 max-w-full">
        <div className="flex space-x-2 sm:items-center flex-col sm:flex-row">
          <InputBase value={apiKey || "*".repeat(24)} readOnly />
          <Button
            onClick={() => {
              if (apiKey) {
                navigator.clipboard.writeText(apiKey);
              } else {
                API.post("/projects/{id}/new-token", {
                  params: {
                    id,
                  },
                }).then((project) => {
                  setKey(project.id, project.token!);
                });
              }
            }}
            variant="secondary"
            className="shrink-0 mt-2 sm:mt-0 !ml-auto sm:!ml-2"
          >
            {apiKey ? "Copy" : "Regenerate"}
          </Button>
        </div>
        <p className="text-on-surface-variant text-sm">
          Make sure you keep this safe. Learn more about how to use this in our
          docs.
        </p>
      </div>
    </div>
  );
}
