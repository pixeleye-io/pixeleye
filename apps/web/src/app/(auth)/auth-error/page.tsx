import { Button } from "@pixeleye/ui";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { getUrlForFlow, isQuerySet, frontend } from "../utils";
import { filterNodesByGroups } from "@ory/integrations/ui";
import { AuthNode, ErrorsList } from "../sharedComponents";
import { FlowError, FrontendApi } from "@ory/kratos-client";
import { XCircleIcon } from "@heroicons/react/24/solid";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { id } = searchParams;

  if( id === undefined) {
    redirect("/dashboard");
    }

  const error = await frontend
    .getFlowError({ id: String(id) })
    .then(({ data }) => data)
    .catch(
      (err: {
        response?: {
          status: number;
        };
      }) => {
        switch (err.response?.status) {
          case 404:
          // The error id could not be found. Let's just redirect home!
          case 403:
          // The error id could not be fetched due to e.g. a CSRF issue. Let's just redirect home!
          case 410:
            // The error id expired. Let's just redirect home!
            redirect("/dashboard");
        }
        return undefined;
      }
    );

  return (
    <>
      <div className="rounded-md bg-surface-container p-4 mb-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <XCircleIcon className="h-5 w-5 text-error" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-error">
              Something went wrong
            </h3>
            {error && (
              <div className="mt-4 text-sm text-error bg-surface-container-low p-4 rounded break-words">
                <code>{JSON.stringify(error, null, 2)}</code>
              </div>
            )}
          </div>
        </div>
      </div>
      <Button asChild>
        <Link href="/dashboard">Go back home</Link>
      </Button>
    </>
  );
}
