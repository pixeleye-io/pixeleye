package processors

// Steps:
// 1. Get snapshot & (build parent) from DB
// 2. Figure out which snapshots to compare it to
// 2.1. If build parent is nil, then there is nothing to compare it to - mark snapshot as new
// 2.2. If build parent is not nil, then compare it to the snapshots in the build parent
// 3 Figure out if snapshot has been previously reviewed in relation to the build parent snapshot
// 3.1 If it has been reviewed, then mark it as reviewed
// 3.2 If it has not been reviewed, then mark it as unreviewed

func IngestSnapshots(snapshotIDs []string) {

}
