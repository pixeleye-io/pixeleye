import type { LogoProps } from "./types";


export function PlaywrightLogo({ className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 192"
      className={className}
      aria-label="Playwright Logo"
      fill="currentColor"
    >
      <path d="M103 138.6v-16.7L57 135s3.4-19.8 27.5-26.6a40 40 0 0 1 18.7-1.1V39h23.1c-2.5-7.8-5-13.8-7-18-3.4-6.9-6.8-2.3-14.7 4.3a109.8 109.8 0 0 1-40.7 20.2 109.2 109.2 0 0 1-45.3 3c-10.1-1.8-15.4-4-15 3.7C4 59 5.7 69.5 9.4 83.4c8 30 34.5 88 84.4 74.5a50.2 50.2 0 0 0 28.6-19.3h-19.2ZM28.6 83.8 64 74.5S63 88 49.6 91.6c-13.3 3.5-21.1-7.8-21.1-7.8Z" />
      <path d="M236.7 39.8c-9.3 1.7-31.4 3.7-58.8-3.7A141.3 141.3 0 0 1 125.2 10c-10.2-8.6-14.6-14.5-19-5.5-4 7.9-9 20.8-13.8 38.8-10.4 39-18.3 121.5 46.4 138.9 64.7 17.3 99.2-58 109.6-97 4.9-18.1 7-31.8 7.6-40.6.6-10-6.2-7-19.3-4.8Zm-130 32.4s10.2-15.9 27.5-11c17.3 5 18.6 24 18.6 24l-46.1-13Zm42.2 71.1c-30.4-8.9-35.1-33.1-35.1-33.1l81.7 22.8s-16.5 19.1-46.6 10.3Zm28.9-49.8s10.2-15.9 27.4-11c17.3 5 18.7 24.1 18.7 24.1l-46.1-13.1Z" />
    </svg>
  );
}
