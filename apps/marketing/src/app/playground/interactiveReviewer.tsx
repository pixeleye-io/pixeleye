"use client"

import { Build } from "@pixeleye/api"
import { BuildAPI, ExtendedSnapshotPair, Reviewer } from "@pixeleye/reviewer"
import { useState } from "react"


export default function InteractiveReviewer({
    build,
    initialSnaps,
    defaultSidebarWidth,
    defaultSidebarOpen
}: {
    build: Build
    initialSnaps: ExtendedSnapshotPair[]
    defaultSidebarWidth?: number
    defaultSidebarOpen?: boolean
}) {

    const [snapshots, setSnapshots] = useState(initialSnaps)


    const buildAPI: BuildAPI = {
        approveSnapshots: (ids) => {
            setSnapshots(snapshots.map(snap => {
                if (ids.includes(snap.id)) {
                    return { ...snap, status: "approved" }
                }
                return snap
            }))
        },
        rejectSnapshots: (ids) => {
            setSnapshots(snapshots.map(snap => {
                if (ids.includes(snap.id)) {
                    return { ...snap, status: "rejected" }
                }
                return snap
            }))
        },

        approveAllSnapshots: () => {
            setSnapshots(snapshots.map(snap => {
                if (["unreviewed", "approved", "rejected"].includes(snap.status)) {
                    return { ...snap, status: "approved" }
                }
                return snap
            }))
        },
        approveRemainingSnapshots: () => {
            setSnapshots(snapshots.map(snap => {
                if (snap.status === "unreviewed") {
                    return { ...snap, status: "approved" }
                }
                return snap
            }))
        },

        rejectAllSnapshots: () => {
            setSnapshots(snapshots.map(snap => {
                if (["unreviewed", "approved", "rejected"].includes(snap.status)) {
                    return { ...snap, status: "rejected" }
                }
                return snap
            }))
        },
        rejectRemainingSnapshots: () => {
            setSnapshots(snapshots.map(snap => {
                if (snap.status === "unreviewed") {
                    return { ...snap, status: "rejected" }
                }
                return snap
            }))
        },
    }



    return (
        <Reviewer
            defaultSidebarWidth={defaultSidebarWidth}
            userRole="admin"
            className="h-[calc(100vh-4rem-1px)] lg:h-[calc(100vh-4.5rem-1px)] mt-px"
            build={build}
            snapshots={snapshots}
            defaultSidebarOpen={defaultSidebarOpen}
            buildAPI={buildAPI}
            optimize
        />
    )

}