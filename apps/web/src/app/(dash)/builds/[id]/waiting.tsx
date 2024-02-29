"use client";

import { useBuildEvents } from "@/libs";
import { queries } from "@/queries";
import { Build } from "@pixeleye/api";
import { Button } from "@pixeleye/ui";
import Spinner from "@pixeleye/ui/src/spinner/spinner";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from 'next/navigation'


export interface WaitingProps {
    buildID: string
}


export function WaitingPage({ buildID }: WaitingProps) {

    useBuildEvents({ buildID })


    const { data: build } = useQuery(queries.builds.detail(buildID));


    const router = useRouter()

    const notReady = ["uploading", "processing", "queued-uploading", "queued-processing"].includes(build?.status || "uploading") // We want to default to disabled


    return (<div className="flex items-center flex-col">

        <h1 className="font-semibold text-lg py-8">Waiting for build to finishing upload/processing</h1>
        <p className="mb-8">
            Build status: <span className="bg-surface-container p-2 rounded">{build?.status}</span>
        </p>



        <Button tooltip={notReady ? "Waiting for build to finish" : undefined} disabled={notReady} onClick={() => router.refresh()}>
            Start Reviewing
        </Button>
    </div>
    );
}