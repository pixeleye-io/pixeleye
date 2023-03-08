import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppSession } from "@pixeleye/auth";
import { ImageSnapshot, SnapImage, Snapshot } from "@pixeleye/db";
import { Container } from "@pixeleye/ui";
import { OrphanedAlert } from "./orphaned";
import { getBuildWithScreenShots, getProjectBranches } from "./services";

async function OrphanedWrapper({
  buildId,
  projectId,
}: {
  buildId: string;
  projectId: string;
}) {
  const branches = await getProjectBranches(projectId);
  return <OrphanedAlert buildId={buildId} branches={branches} />;
}

interface SnapshotItemProps {
  snapshot: Snapshot & {
    imageSnapshots: (ImageSnapshot & {
      image: SnapImage;
    })[];
  };
  buildId: string;
}

function SnapshotItem({ snapshot, buildId }: SnapshotItemProps) {
  return (
    <li className="relative">
      <div className="block w-full overflow-hidden bg-gray-100 border border-gray-700 rounded-lg dark:bg-gray-900 group aspect-w-10 aspect-h-7 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100">
        <Image
          unoptimized
          fill
          src={snapshot.imageSnapshots[0]?.image?.url || ""}
          alt=""
          className="object-contain w-full p-1 pointer-events-none group-hover:opacity-75"
        />
        <Link
          href={`/build/${buildId}/${snapshot.id}`}
          className="absolute inset-0 focus:outline-none"
        >
          <span className="sr-only">Review {snapshot.name}</span>
        </Link>
      </div>
      <p className="block mt-2 text-sm font-medium text-gray-900 truncate pointer-events-none">
        {snapshot.name}
      </p>
      <p className="block text-sm font-medium text-gray-500 pointer-events-none">
        {snapshot.variant}
      </p>
    </li>
  );
}

export default async function BuildPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getAppSession();

  if (!session) return redirect("/login");

  const build = await getBuildWithScreenShots(params.id, session.user.id);

  if (!build) return redirect("/");

  return (
    <Container>
      <div className="my-8">
        <h2 className="text-3xl font-semibold">{build.name}</h2>
      </div>
      {build.status === "ORPHANED" && (
        // @ts-ignore
        <OrphanedWrapper buildId={build.id} projectId={build.projectId} />
      )}
      <section>
        <h3 className="text-lg font-medium">Snapshots</h3>
        <ul
          role="list"
          className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-5 xl:gap-x-8"
        >
          {build.report.snapshots.map((snapshot) => (
            <SnapshotItem
              buildId={params.id}
              key={snapshot.id}
              snapshot={snapshot}
            />
          ))}
        </ul>
      </section>
    </Container>
  );
}
