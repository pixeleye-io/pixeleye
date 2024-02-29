"use client";

import { queries } from "@/queries";
import { useQuery } from "@tanstack/react-query";
import { RegisterSegment } from "../../breadcrumbStore";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Button, DropdownMenu, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@pixeleye/ui";
import NextLink from "next/link";


function QuickBuildNav({
    buildID,
}: {
    buildID: string;
}) {

    const { data: build } = useQuery(queries.builds.detail(buildID));
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost"><ChevronDownIcon className="h-4 w-4" /><ChevronDownIcon className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>

            <DropdownMenuPortal>
                <DropdownMenuContent>
                    <DropdownMenuItem>
                        Latest Build
                    </DropdownMenuItem>
                    <DropdownMenuItem>Next Build</DropdownMenuItem>
                    <DropdownMenuItem>Previous Build</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
    )
}

export function BuildSegments({ buildID, projectID }: { buildID: string, projectID: string }) {

    const { data: build } = useQuery(queries.builds.detail(buildID));

    const { data: project } = useQuery(queries.projects.detail(projectID));

    return (
        <RegisterSegment
            order={1}
            reference="builds"
            segment={[
                {
                    name: project?.name || "",
                    value: `/projects/${build?.projectID}`,
                },
                {
                    name: `#${build?.buildNumber || ""}`,
                    value: `/builds/${buildID}`,
                    status: build?.status,
                    // suffix: <QuickBuildNav buildID={buildID} />
                },
            ]}
        />
    )
}