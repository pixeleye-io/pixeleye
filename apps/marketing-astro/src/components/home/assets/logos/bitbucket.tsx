import type { LogoProps } from "./types";

export function BitBucketLogo({ className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
      viewBox="0 0 512 512"
      aria-label="Bitbucket Logo"
    >
      <path d="M422 130a10 10 0 00-9.9-11.7H100.5a10 10 0 00-10 11.7L136 409a10 10 0 009.9 8.4h221c5 0 9.2-3.5 10 -8.4L422 130zM291 316.8h-69.3l-18.7-98h104.8z" />
    </svg>
  );
}
