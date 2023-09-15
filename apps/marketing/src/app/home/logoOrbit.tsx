import { GiftIcon, WindowIcon } from "@heroicons/react/24/outline";
import { Logo } from "@pixeleye/ui";
import { cx } from "class-variance-authority";
import { BitBucketLogo, GithubLogo, GitlabLogo } from "./logos";

export interface PlanetProps {
  children: React.ReactNode;
  count: number;
  index: number;
}

function Planet({ children, count, index }: PlanetProps) {
  const x = Math.abs(Math.cos(((Math.PI * 2) / count) * index) * 50 - 50);
  const y = Math.abs(Math.sin(((Math.PI * 2) / count) * index) * 50 - 50);

  return (
    <li
      className="absolute rounded-full bg-surface-container-high p-2 -translate-x-1/2 -translate-y-1/2"
      style={{
        top: `${x}%`,
        left: `${y}%`,
      }}
    >
      {children}
    </li>
  );
}

export interface RingProps {
  children: React.ReactNode;
  className?: string;
}

function Ring({ children, className }: RingProps) {
  return (
    <li
      className={cx(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 peer-hover:scale-75 transition rounded-full",
        className
      )}
    >
      <ul
        style={{
          animationDuration: `${Math.random() * 15 + 20}s`,
          animationDelay: `-${Math.random() * 10}s`,
        }}
        className="w-full h-full animate-spin rounded-full border border-outline-variant hover:border-outline transition relative"
      >
        {children}
      </ul>
    </li>
  );
}

export default function LogoOrbit() {
  return (
    <div className="relative h-[34rem] w-[34rem] mx-auto z-0 scale-[0.6] sm:scale-100 xs:scale-75 -my-24 sm:my-0">
      <ul className="">
        {/** Center pixeleye logo */}
        <li className="absolute top-1/2 left-1/2 z-50 peer hover:scale-125 transition origin-center -translate-x-1/2 -translate-y-1/2 p-4 rounded-full bg-surface-container-highest">
          <Logo className="h-12 w-12 text-tertiary" />
        </li>
        <Ring className="w-48 h-48 z-20">
          <Planet count={3} index={0}>
            <GithubLogo className="w-12 h-12" />
          </Planet>
          <Planet count={3} index={1}>
            <GitlabLogo className="w-10 h-10" />
          </Planet>
          <Planet count={3} index={2}>
            <BitBucketLogo className="w-8 h-8" />
          </Planet>
        </Ring>
        <Ring className="w-[22rem] h-[22rem] z-10">
          <Planet count={5} index={0}>
            <GiftIcon className="w-8 h-8" />
          </Planet>
          <Planet count={5} index={1}>
            <WindowIcon className="w-8 h-8" />
          </Planet>
          <Planet count={5} index={2}>
            <WindowIcon className="w-8 h-8" />
          </Planet>
          <Planet count={5} index={3}>
            <WindowIcon className="w-8 h-8" />
          </Planet>
          <Planet count={5} index={4}>
            <WindowIcon className="w-8 h-8" />
          </Planet>
        </Ring>
        <Ring className="w-[32rem] h-[32rem] z-0">
          <Planet count={4} index={0}>
            <GiftIcon className="w-8 h-8" />
          </Planet>
          <Planet count={4} index={1}>
            <WindowIcon className="w-8 h-8" />
          </Planet>
          <Planet count={4} index={2}>
            <WindowIcon className="w-8 h-8" />
          </Planet>
          <Planet count={4} index={3}>
            <WindowIcon className="w-8 h-8" />
          </Planet>
        </Ring>
      </ul>
    </div>
  );
}
