"use client";

import { queries } from "@/queries";
import { useQuery } from "@tanstack/react-query";
import { RegisterSegment } from "../../breadcrumbStore";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Button } from "@pixeleye/ui";

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
                    suffix: <Button size="icon" variant="ghost"><ChevronDownIcon className="h-4 w-4" /></Button>,
                },
            ]}
        />
    )
}