const plans = [
  {
    name: "Solo dev",
    developers: "1 dev",
    pushes: "5 daily pushes",
    snapshots: "75 snaps",
    count: "1 * 5 * 75 * 20 = 7,500 monthly snapshots",
    price: "$0",
  },
  {
    name: "Small team",
    developers: "3 devs",
    pushes: "5 daily pushes",
    snapshots: "100 snaps",
    count: "3 * 5 * 100 * 20 = 30,000 monthly snapshots",
    price: "$0.003 * 22.5k = $67.50",
  },
  {
    name: "Medium team",
    developers: "6 devs",
    pushes: "5 daily pushes",
    snapshots: "200 snaps",
    count: "6 * 5 * 200 * 20 = 120,000 monthly snapshots",
    price: "$0.003 * 100k + 12.5k * 0.0025 = $331.25",
  },
];

export function Examples() {
  return (
    <ul role="list" className="space-y-4 my-12">
      {plans.map((plan) => (
        <li
          key={plan.name}
          className="relative border-outline-variant block rounded-lg border bg-surface px-6 py-4 shadow-sm focus:outline-none sm:flex sm:justify-between"
        >
          <span className="flex items-center">
            <span className="flex flex-col text-sm">
              <span className="font-medium text-on-surface text-left">
                {plan.name}
              </span>
              <span className="text-on-surface-variant">
                <span className="inline">
                  {plan.developers} / {plan.pushes}
                </span>{" "}
                <span className="hidden sm:mx-1 sm:inline" aria-hidden="true">
                  &middot;
                </span>{" "}
                <span className="block sm:inline">{plan.snapshots}</span>
              </span>
            </span>
          </span>
          <span className="mt-2 flex text-sm sm:ml-4 sm:mt-0 flex-col sm:text-right">
            <span className="font-medium text-on-surface">{plan.price}/mo</span>
            <span className="text-on-surface-variant ">
              {plan.count}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
