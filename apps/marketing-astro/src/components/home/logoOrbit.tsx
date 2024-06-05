import { Logo } from "@pixeleye/ui";
import { cx } from "class-variance-authority";
import { BitBucketLogo, CypressLogo, GithubLogo, GitlabLogo, PlaywrightLogo, PuppeteerLogo, StorybookLogo } from "./assets/logos";
import { ChromiumLogo, EdgeLogo, WebkitLogo, FirefoxLogo } from "@pixeleye/device-logos";
import OperaLogo from "@pixeleye/device-logos/src/opera";

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
      className="absolute rounded-full bg-surface-container-high border-outline-variant border shadow p-2 group-hover:bg-surface-container-highest group-hover:text-on-tertiary-container transition -translate-x-1/2 -translate-y-1/2"
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
          animationDuration: `${Math.random() * 20 + 25}s`,
          animationDelay: `-${Math.random() * 10}s`,
        }}
        className="w-full h-full animate-spin group transition relative"
      >
        <span className="absolute rounded-full inset-0 group-hover:border-tertiary border-2 transition border-outline" />
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
            <ChromiumLogo className="w-8 h-8" />
          </Planet>
          <Planet count={5} index={1}>
            <EdgeLogo className="w-8 h-8" />
          </Planet>
          <Planet count={5} index={2}>
            <WebkitLogo className="w-8 h-8" />
          </Planet>
          <Planet count={5} index={3}>
            <FirefoxLogo className="w-8 h-8" />
          </Planet>
          <Planet count={5} index={4}>
            <OperaLogo className="w-8 h-8" />
          </Planet>
        </Ring>
        <Ring className="w-[32rem] h-[32rem] z-0">
          <Planet count={4} index={0}>
            <PlaywrightLogo className="w-8 h-8" />
          </Planet>
          <Planet count={4} index={1}>
            <StorybookLogo className="w-8 h-8" />
          </Planet>
          <Planet count={4} index={2}>
            <CypressLogo className="w-8 h-8" />
          </Planet>
          <Planet count={4} index={3}>
            <PuppeteerLogo className="w-8 h-8" />
          </Planet>
        </Ring>
      </ul>
    </div >
  );
}
