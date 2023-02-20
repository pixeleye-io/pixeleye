import Image from "next/image";
import { authOptions } from "@pixeleye/auth";
import { Container } from "@pixeleye/ui";
import { getServerSession } from "next-auth";
import { RouterOutputs } from "~/lib/api";
import { serverApi } from "~/lib/server";

type Snapshot = RouterOutputs["build"]["getWithSnapshots"]["Snapshots"][0];

interface SnapshotItemProps {
  snapshot: Snapshot;
}

function SnapshotItem({ snapshot }: SnapshotItemProps) {
  return (
    <li className="relative ">
      <div className="block w-full overflow-hidden bg-gray-100 border border-gray-700 rounded-lg dark:bg-gray-900 group aspect-w-10 aspect-h-7 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100">
        <Image
          fill
          src={snapshot.visualSnapshots[0]?.image?.url || ""}
          alt=""
          className="object-contain w-full p-1 pointer-events-none group-hover:opacity-75"
        />
        <button type="button" className="absolute inset-0 focus:outline-none">
          <span className="sr-only">View details for {snapshot.name}</span>
        </button>
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
  const session = await getServerSession(authOptions);
  const data = await serverApi(session).build.getWithSnapshots({
    id: params.id,
  });

  console.log(data);
  return (
    <Container>
      <div className="my-8">
        <h2 className="text-3xl font-semibold">
          {data.pullRequestTitle || data.id}
        </h2>
      </div>
      <ul
        role="list"
        className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-5 xl:gap-x-8"
      >
        {data.Snapshots.map((snapshot) => (
          <SnapshotItem key={snapshot.id} snapshot={snapshot} />
        ))}
      </ul>
    </Container>
  );
}
