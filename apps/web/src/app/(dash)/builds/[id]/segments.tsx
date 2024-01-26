"use client";

import { queries } from "@/queries";
import { useQuery } from "@tanstack/react-query";
import { RegisterSegment } from "../../breadcrumbStore";

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
                },
            ]}
        />
    )
}