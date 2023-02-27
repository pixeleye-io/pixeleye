"use client";

import { ClipboardIcon } from "@heroicons/react/24/outline";
import { Button } from "@pixeleye/ui";
import { useQueryClient } from "@tanstack/react-query";
import { cx } from "class-variance-authority";
import { api } from "~/lib/api";
import { API_SECRET } from "../../add/page2";

interface TokenViewProps {
  projectId: string;
  projectKey: string;
  className?: string;
}

const hidden = "********-****-****-****-************";

interface CopyButtonProps {
  text: string;
}
function CopyButton({ text }: CopyButtonProps) {
  return (
    <button
      title="Copy to clipboard"
      onClick={() => navigator.clipboard.writeText(text)}
      className="px-2 ml-auto text-gray-600 transition rounded-lg opacity-0 group-hover:opacity-100 bg-gray-50 dark:bg-gray-850 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200"
    >
      <ClipboardIcon className="w-4 h-4" />
    </button>
  );
}

export default function TokenView({
  projectId,
  projectKey,
  className,
}: TokenViewProps) {
  const queryClient = useQueryClient();
  const secret = queryClient.getQueryData([API_SECRET, projectId]) as string;

  const { mutate: regenerateSecret, isLoading } =
    api.project.regenerateProjectSecret.useMutation({
      onSuccess: (data) => {
        queryClient.setQueryData([API_SECRET, projectId], data);
      },
    });

  return (
    <div
      className={cx(
        "rounded-lg border border-gray-100 dark:border-gray-800 px-8 py-4 flex flex-col items-center mx-auto max-w-xl bg-gray-50 dark:bg-gray-850",
        className,
      )}
    >
      <div className="flex flex-col">
        <h1 className="text-lg">Access key & secret</h1>
        <div className="mb-8 text-sm text-gray-700 dark:text-gray-400">
          Keep your secret safe. If you lose it you&apos;ll have to generate a
          new one.
        </div>
        <p className="flex inline p-2 mb-4 border border-gray-200 rounded group dark:border-gray-700 bg-gray-white dark:bg-gray-900">
          Key: <p className="pl-8">{projectKey}</p>
          <CopyButton text={projectKey} />
        </p>
        <div className="flex inline p-2 border border-gray-200 rounded group dark:border-gray-700 bg-gray-white dark:bg-gray-900">
          Secret: <p className="pl-2"> {secret || hidden}</p>
          {secret && <CopyButton text={secret} />}
        </div>
        {!secret && (
          <Button
            loading={isLoading}
            onClick={() =>
              regenerateSecret({
                id: projectId,
              })
            }
            size={"small"}
            variant="secondary"
            className="inline mt-4 ml-auto"
          >
            Regenerate Secret
          </Button>
        )}
      </div>
    </div>
  );
}
