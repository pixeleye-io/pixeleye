import {
    ChartBarSquareIcon,
    Cog6ToothIcon,
    FolderIcon,
    GlobeAltIcon,
    ServerIcon,
    SignalIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { cx } from 'class-variance-authority'
import { Logo } from '@pixeleye/ui'
import ProfilePicture from "./assets/profile-picture.png"
import ManPicture from "./assets/man-graffity.jpg"
import WomanPicture from "./assets/woman-smiling.jpg"
import Image from 'next/image'

const navigation = [
    { name: 'Projects', href: '#', icon: FolderIcon, current: false },
    { name: 'Deployments', href: '#', icon: ServerIcon, current: true },
    { name: 'Activity', href: '#', icon: SignalIcon, current: false },
    { name: 'Usage', href: '#', icon: ChartBarSquareIcon, current: false },
    { name: 'Settings', href: '#', icon: Cog6ToothIcon, current: false },
]
const teams = [
    { id: 1, name: 'Pixeleye', href: '#', initial: 'P', current: false },
    { id: 2, name: 'FirstByte', href: '#', initial: 'F', current: false },
]
const secondaryNavigation = [
    { name: 'Overview', href: '#', current: true },
    { name: 'Activity', href: '#', current: false },
    { name: 'Settings', href: '#', current: false },
    { name: 'Collaborators', href: '#', current: false },
    { name: 'Notifications', href: '#', current: false },
]
const stats = [
    { name: 'Bugs avoided', value: '4051' },
    { name: 'Time saved', value: '350', unit: 'hours' },
    { name: 'Number of snapshots', value: '342' },
    { name: 'Success rate', value: '98.5%' },
]
const statuses = { Completed: 'text-green-400 bg-green-400/10', Error: 'text-rose-400 bg-rose-400/10' }
const activityItems = [
    {
        user: {
            name: 'Dr Null',
            imageUrl: WomanPicture,
        },
        commit: '2d89f0c8',
        branch: 'main',
        status: 'Completed',
        duration: '25s',
        date: '45 minutes ago',
        dateTime: '2023-01-23T11:00',
    },
    {
        user: {
            name: 'Vim colon wq',
            imageUrl:
                ManPicture,
        },
        commit: '4da6e89f',
        branch: 'main',
        status: 'Completed',
        duration: '29s',
        date: '59 minutes ago',
        dateTime: '2023-01-23T10:46',
    },
]

export default function Example({
    offset
}: {
    offset?: boolean
}) {

    return (
        <>
            <div className="h-full border border-outline-variant overflow-hidden relative rounded-md">
                {/* Static sidebar for desktop */}
                <div className="hidden xl:absolute xl:inset-y-0 xl:z-50 xl:flex xl:w-72 xl:flex-col">
                    {/* Sidebar component, swap this element with another sidebar if you like */}
                    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-surface-container-low px-6 ring-1 ring-white/5 border border-r border-outline-variant">
                        <div className="flex h-16 shrink-0 items-center">
                            <Logo className="h-8 w-auto text-tertiary" />
                        </div>
                        <nav className="flex flex-1 flex-col">
                            <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                <li className={offset ? "ml-4 mt-1" : ""}>
                                    <ul role="list" className="-mx-2 space-y-1">
                                        {navigation.map((item) => (
                                            <li key={item.name}>
                                                <a
                                                    href={item.href}
                                                    className={cx(
                                                        item.current
                                                            ? 'bg-surface-container-low text-on-surface'
                                                            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
                                                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                    )}
                                                >
                                                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                                    {item.name}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                                <li>
                                    <div className="text-xs font-semibold leading-6 text-on-surface-variant">Your teams</div>
                                    <ul role="list" className="-mx-2 mt-2 space-y-1">
                                        {teams.map((team) => (
                                            <li key={team.name}>
                                                <a
                                                    href={team.href}
                                                    className={
                                                        'text-on-surface-variant group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                    }
                                                >
                                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-high text-[0.625rem] font-medium text-on-surface group-hover:texst-on-surface">
                                                        {team.initial}
                                                    </span>
                                                    <span className="truncate">{team.name}</span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                                <li className="-mx-6 mt-auto">
                                    <a
                                        href="#"
                                        className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-on-surface hover:bg-surface-container"
                                    >
                                        <Image
                                            className="h-8 w-8 rounded-full bg-surface-container-highest"
                                            src={ProfilePicture}
                                            alt="Alfie's profile picture"
                                        />
                                        <span className="sr-only">Your profile</span>
                                        <span aria-hidden="true">Alfie Jones</span>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div >

                <div className="xl:pl-72 h-full">
                    {/* Sticky search header */}
                    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-6 border-b border-outline-variant bg-surface-container-low/50 px-4 shadow-sm sm:px-6 lg:px-8">
                        <button type="button" className="-m-2.5 p-2.5 text-on-surface xl:hidden">
                            <span className="sr-only">Open sidebar</span>
                            <Bars3Icon className="h-5 w-5" aria-hidden="true" />
                        </button>

                        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                            <form className="flex flex-1" action="#" method="GET">
                                <label htmlFor="search-field" className="sr-only">
                                    Search
                                </label>
                                <div className="relative w-full">
                                    <MagnifyingGlassIcon
                                        className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-on-surface-variant"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="search-field"
                                        className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-on-surface focus:ring-0 sm:text-sm placeholder-on-surface-variant"
                                        placeholder="Search..."
                                        type="search"
                                        name="search"
                                    />
                                </div>
                            </form>
                        </div>
                    </div>

                    <main className="h-full">
                        <header>
                            {/* Secondary navigation */}
                            <nav className="flex overflow-x-auto border-b border-outline-variant py-4 bg-surface-container-low/50">
                                <ul
                                    role="list"
                                    className={cx("flex min-w-full flex-none gap-x-6 px-4 text-sm font-semibold leading-6 text-on-surface-variant sm:px-6 lg:px-8", offset && "odd:mt-1 even:mb-1")}
                                >
                                    {secondaryNavigation.map((item) => (
                                        <li className={cx(offset && "even:-mt-1 odd:-mb-1")} key={item.name}>
                                            <a href={item.href} className={cx(item.current && 'text-tertiary')}>
                                                {item.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>

                            {/* Heading */}
                            <div className="flex flex-col items-start justify-between gap-x-8 gap-y-4 bg-surface px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
                                <div>
                                    <div className="flex items-center gap-x-3">
                                        <div className="flex-none rounded-full bg-green-400/10 p-1 text-green-400">
                                            <div className="h-2 w-2 rounded-full bg-current" />
                                        </div>
                                        <h1 className="flex gap-x-3 text-base leading-7">
                                            <span className="font-semibold texst-on-surface">Pixeleye-io</span>
                                            <span className="text-outline">/</span>
                                            <span className="font-semibold texst-on-surface">pixeleye</span>
                                        </h1>
                                    </div>
                                    <p className={cx("mt-2 text-xs leading-6 text-on-surface-variant", offset && "font-semibold")}>Deploys from GitHub via main branch</p>
                                </div>
                                <div className="order-first flex-none rounded-full bg-tertiary/10 px-2 py-1 text-xs font-medium text-tertiary ring-1 ring-inset ring-tertiary sm:order-none">
                                    Production
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-1 bg-surface gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                                {stats.map((stat, statIdx) => (
                                    <div
                                        key={stat.name}
                                        className={cx(
                                            statIdx % 2 === 1 ? 'sm:border-l' : statIdx === 2 ? 'lg:border-l' : '',
                                            'border-t border-outline-variant py-6 px-4 sm:px-6 rounded bg-tertiary-container',
                                            offset && statIdx === 0 && "mt-1"
                                        )}
                                    >
                                        <p className="text-sm font-medium leading-6 text-on-tertiary-container">{stat.name}</p>
                                        <p className="mt-2 flex items-baseline gap-x-2">
                                            <span className="text-4xl font-semibold tracking-tight texst-on-surface">{stat.value}</span>
                                            {stat.unit ? <span className="text-sm text-on-surface-variant">{stat.unit}</span> : null}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </header>

                        {/* Activity list */}
                        <div className="border-t border-outline-variant pt-11 bg-surface h-full">
                            <h2 className="px-4 text-base font-semibold leading-7 texst-on-surface sm:px-6 lg:px-8">Latest activity</h2>
                            <table className="mt-6 w-full whitespace-nowrap text-left">
                                <colgroup>
                                    <col className="w-full sm:w-4/12" />
                                    <col className="lg:w-4/12" />
                                    <col className="lg:w-2/12" />
                                    <col className="lg:w-1/12" />
                                    <col className="lg:w-1/12" />
                                </colgroup>
                                <thead className="border-b border-outline-variant text-sm leading-6 texst-on-surface">
                                    <tr>
                                        <th scope="col" className="py-2 pl-4 pr-8 font-semibold sm:pl-6 lg:pl-8">
                                            User
                                        </th>
                                        <th scope="col" className="hidden py-2 pl-0 pr-8 font-semibold sm:table-cell">
                                            Commit
                                        </th>
                                        <th scope="col" className="py-2 pl-0 pr-4 text-right font-semibold sm:pr-8 sm:text-left lg:pr-20">
                                            Status
                                        </th>
                                        <th scope="col" className="hidden py-2 pl-0 pr-8 font-semibold md:table-cell lg:pr-20">
                                            Duration
                                        </th>
                                        <th
                                            scope="col"
                                            className="hidden py-2 pl-0 pr-4 text-right font-semibold sm:table-cell sm:pr-6 lg:pr-8"
                                        >
                                            Deployed at
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {activityItems.map((item) => (
                                        <tr key={item.commit}>
                                            <td className="py-4 pl-4 pr-8 sm:pl-6 lg:pl-8">
                                                <div className={cx("flex items-center gap-x-4", offset && "space-x-1")}>
                                                    <Image src={item.user.imageUrl} alt="Profile picture" className="h-8 w-8 rounded-full bg-surface-container object-cover" />
                                                    <div className="truncate text-sm font-medium leading-6 texst-on-surface">{item.user.name}</div>
                                                </div>
                                            </td>
                                            <td className="hidden py-4 pl-0 pr-4 sm:table-cell sm:pr-8">
                                                <div className="flex gap-x-3">
                                                    <div className="font-mono text-sm leading-6 text-on-surface-variant">{item.commit}</div>
                                                    <span className="inline-flex items-center rounded-md bg-surface-container px-2 py-1 text-xs font-medium text-on-surface-variant ring-1 ring-inset ring-outline">
                                                        {item.branch}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 pl-0 pr-4 text-sm leading-6 sm:pr-8 lg:pr-20">
                                                <div className="flex items-center justify-end gap-x-2 sm:justify-start">
                                                    <time className="text-on-surface-variant sm:hidden" dateTime={item.dateTime}>
                                                        {item.date}
                                                    </time>
                                                    <div className={cx(statuses[item.status as keyof typeof statuses], 'flex-none rounded-full p-1')}>
                                                        <div className="h-1.5 w-1.5 rounded-full bg-current" />
                                                    </div>
                                                    <div className="hidden texst-on-surface sm:block">{item.status}</div>
                                                </div>
                                            </td>
                                            <td className="hidden py-4 pl-0 pr-8 text-sm leading-6 text-on-surface-variant md:table-cell lg:pr-20">
                                                {item.duration}
                                            </td>
                                            <td className="hidden py-4 pl-0 pr-4 text-right text-sm leading-6 text-on-surface-variant sm:table-cell sm:pr-6 lg:pr-8">
                                                <time dateTime={item.dateTime}>{item.date}</time>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </main>
                </div>
            </div >
        </>
    )
}
