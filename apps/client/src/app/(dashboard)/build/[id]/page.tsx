import Image from "next/image";
import Link from "next/link";
import { authOptions } from "@pixeleye/auth";
import { Container } from "@pixeleye/ui";
import { getServerSession } from "next-auth";
import { RouterOutputs } from "~/lib/api";
import { serverApi } from "~/lib/server";

type Snapshot = RouterOutputs["build"]["getWithSnapshots"]["Snapshots"][0];

interface SnapshotItemProps {
  snapshot: Snapshot;
  buildId: string;
}

function SnapshotItem({ snapshot, buildId }: SnapshotItemProps) {
  return (
    <li className="relative">
      <div className="block w-full overflow-hidden bg-gray-100 border border-gray-700 rounded-lg dark:bg-gray-900 group aspect-w-10 aspect-h-7 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100">
        <Image
          unoptimized
          fill
          src={snapshot.visualSnapshots[0]?.image?.url || ""}
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
      {snapshot.visualSnapshots[0]?.VisualDifference?.diffImage?.url && (
        <a
          href={snapshot.visualSnapshots[0]?.VisualDifference?.diffImage?.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Diff
        </a>
      )}
    </li>
  );
}

export default async function BuildPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const data = await serverApi(session).build.getWithSnapshots({
    id: params.id,
  });

  const unreviewedSnapshots = data.Snapshots.filter(
    (snapshot) =>
      !snapshot.visualSnapshots.some(
        (vs) => vs.VisualDifference?.status === "PENDING",
      ),
  );

  return (
    <Container>
      <div className="my-8">
        <h2 className="text-3xl font-semibold">
          {data.pullRequestTitle || data.id}
        </h2>
      </div>
      <section>
        <h3 className="text-lg font-medium">Unreviewed Snapshots</h3>
        <ul
          role="list"
          className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-5 xl:gap-x-8"
        >
          {unreviewedSnapshots.map((snapshot) => (
            <SnapshotItem
              buildId={params.id}
              key={snapshot.id}
              snapshot={snapshot}
            />
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-lg font-medium">Reviewed Snapshots</h3>
        <ul
          role="list"
          className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-5 xl:gap-x-8"
        >
          {data.Snapshots.map((snapshot) => (
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
