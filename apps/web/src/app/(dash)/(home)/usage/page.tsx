import { API } from "@/libs";
import { getTeam } from "@/serverLibs";
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { TeamPlan } from "@pixeleye/api";
import { cx } from "class-variance-authority";
import { cookies } from "next/headers";


interface StatType {
  name: string;
  stat: string;
  previousStat: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'level';
}

function calculateCost(plan: TeamPlan, snapshots: number): number {
  if (!plan.pricing) return 0;

  return plan.pricing.reduce((prev, curr) => {
    if (!curr.to) {
      return prev + (Math.max(snapshots - curr.from, 0) * curr.price);
    }

    if (snapshots > curr.to) {
      return prev + ((curr.to - curr.from) * curr.price);
    }

    return prev + (Math.max(snapshots - curr.from, 0) * curr.price);
  }, 0);
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

  const [snapUsage, buildUsage, teamPlan] = await Promise.all([API.get("/teams/{teamID}/usage/snapshots", {
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
  }), API.get("/teams/{teamID}/billing/plan", {
    headers: {
      cookie,
    },
    params: {
      teamID: team.id,
    },
  }).catch(() => ({
    name: "Free",
  } as TeamPlan))]);

  const cost = calculateCost(teamPlan, snapUsage.snapshotCount);
  const prevCost = calculateCost(teamPlan, snapUsage.prevSnapshotCount);

  const snapshotChange = ((snapUsage.snapshotCount - snapUsage.prevSnapshotCount) / snapUsage.prevSnapshotCount) * 100;
  const snapshotCostChange = (cost - prevCost / prevCost) * 100;
  const buildChange = ((buildUsage.buildCount - buildUsage.prevBuildCount) / buildUsage.prevBuildCount) * 100;

  const stats: StatType[] = [
    {
      name: "Total snapshots",
      stat: snapUsage.snapshotCount.toString(),
      previousStat: snapUsage.prevSnapshotCount.toString(),
      change: `${Number.isNaN(snapshotChange) ? 0 : snapshotChange.toFixed(2)} %`,
      changeType: snapshotChange > 0 ? "increase" : snapshotChange < 0 ? "decrease" : "level",
    },
    {
      name: "Total builds",
      stat: buildUsage.buildCount.toString(),
      previousStat: buildUsage.prevBuildCount.toString(),
      change: `${Number.isNaN(buildChange) ? 0 : buildChange.toFixed(2)} %`,
      changeType: buildChange > 0 ? "increase" : buildChange < 0 ? "decrease" : "level",
    },
    {
      name: "Total cost",
      stat: `$${cost.toFixed(2)}`,
      previousStat: `$${prevCost.toFixed(2)}`,
      change: `${Number.isNaN(snapshotCostChange) ? 0 : snapshotCostChange.toFixed(2)} %`,
      changeType: snapshotCostChange > 0 ? "increase" : snapshotCostChange < 0 ? "decrease" : "level",
    }
  ];


  return (
    <main>
      <div className="pt-12">
        <h3 className="text-base font-semibold leading-6 text-on-surface">Last 30 days</h3>
        <p className="text-on-surface-variant text-sm mb-6">Total cost is just an estimate based on the total snapshots used within this period. Please check your invoices for an accurate price</p>
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
                    item.changeType === 'increase' ? 'bg-green-100 text-green-800' : item.changeType === 'level' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800',
                    'inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0'
                  )}
                >
                  {item.changeType === 'increase' ? (
                    <ArrowUpIcon
                      className="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center text-green-500"
                      aria-hidden="true"
                    />
                  ) : item.changeType === 'level' ? (
                    <ArrowRightIcon
                      className="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center text-blue-500"
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
