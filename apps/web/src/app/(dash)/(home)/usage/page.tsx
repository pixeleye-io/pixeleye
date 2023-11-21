import { API } from "@/libs";
import { getTeam } from "@/serverLibs";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { cx } from "class-variance-authority";
import { cookies } from "next/headers";


interface StatType {
  name: string;
  stat: string;
  previousStat: string;
  change: string;
  changeType: 'increase' | 'decrease';
}

export default async function UsagePage({
  searchParams
}: {
  searchParams: {
    team?: string | undefined;
  }
}) {


  const team = await getTeam(searchParams)


  const cookie = cookies().toString();

  const [snapUsage, buildUsage] = await Promise.all([API.get("/teams/{teamID}/usage/snapshots", {
    headers: {
      cookie,
    },
    params: {
      teamID: team.id,
    },
  }), API.get("/teams/{teamID}/usage/builds", {
    headers: {
      cookie,
    },
    params: {
      teamID: team.id,
    },
  })]);


  const snapshotChange = ((snapUsage.snapshotCount - snapUsage.prevSnapshotCount) / snapUsage.prevSnapshotCount) * 100;
  const snapshotCostChange = ((Math.max(snapUsage.snapshotCount - 5000, 0) - Math.max(snapUsage.prevSnapshotCount - 5000, 0) / Math.max(snapUsage.prevSnapshotCount - 5000, 0)) * 100);
  const buildChange = ((buildUsage.buildCount - buildUsage.prevBuildCount) / buildUsage.prevBuildCount) * 100;



  const stats: StatType[] = [
    {
      name: "Total snapshots",
      stat: snapUsage.snapshotCount.toString(),
      previousStat: snapUsage.prevSnapshotCount.toString(),
      change: `${snapshotChange.toFixed(2)} %`,
      changeType: snapshotChange > 0 ? "increase" : "decrease",
    },
    {
      name: "Total builds",
      stat: buildUsage.buildCount.toString(),
      previousStat: buildUsage.prevBuildCount.toString(),
      change: `${buildChange.toFixed(2)} %`,
      changeType: buildChange > 0 ? "increase" : "decrease",
    },
    {
      name: "Total cost ($0.003 per snapshot)",
      stat: `$${(Math.max(snapUsage.snapshotCount - 5000, 0) * 0.003).toFixed(2)}`,
      previousStat: `$${(Math.max(snapUsage.prevSnapshotCount - 5000, 0) * 0.003).toFixed(2)}`,
      change: `${snapshotCostChange.toFixed(2)} %`,
      changeType: snapshotChange > 0 ? "increase" : "decrease",
    }
  ];

  return (
    <main>
      <div className="pt-12">
        <h3 className="text-base font-semibold leading-6 text-on-surface mb-4">Last 30 days</h3>
        <dl className="mt-5 grid grid-cols-1 divide-y divide-outline overflow-hidden rounded-lg bg-surface-container shadow md:grid-cols-3 md:divide-x md:divide-y-0">
          {stats.map((item) => (
            <div key={item.name} className="px-4 py-5 sm:p-6">
              <dt className="text-base font-normal text-on-surface">{item.name}</dt>
              <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                <div className="flex items-baseline text-2xl font-semibold text-primary">
                  {item.stat}
                  <span className="ml-2 text-sm font-medium text-on-surface-variant0">from {item.previousStat}</span>
                </div>

                <div
                  className={cx(
                    item.changeType === 'increase' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
                    'inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0'
                  )}
                >
                  {item.changeType === 'increase' ? (
                    <ArrowUpIcon
                      className="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center text-green-500"
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowDownIcon
                      className="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center text-red-500"
                      aria-hidden="true"
                    />
                  )}

                  <span className="sr-only"> {item.changeType === 'increase' ? 'Increased' : 'Decreased'} by </span>
                  {item.change}
                </div>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
