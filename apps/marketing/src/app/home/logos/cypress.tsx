import { LogoProps } from "./types";


export function CypressLogo({ className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-label="Cypress Logo"
      fill="currentColor"
    >

      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 1 0 0-24zM6.4 14.6c.4.5.9.7 1.6.7.4 0 .7 0 1-.2.3 0 .7-.3 1.1-.5l1.2 1.7c-1 .8-2 1.2-3.4 1.2-1 0-2-.2-2.7-.6a4.4 4.4 0 0 1-1.8-2c-.3-.8-.6-1.7-.6-2.9 0-1 .3-2 .6-2.9a4.6 4.6 0 0 1 1.8-2c.7-.5 1.7-.7 2.7-.7a5 5 0 0 1 1.8.3 5.6 5.6 0 0 1 1.6 1l-1.2 1.6a4.8 4.8 0 0 0-1-.5c-.3-.2-.7-.2-1-.2-1.5 0-2.3 1.1-2.3 3.4 0 1.2.2 2 .6 2.6zm12 2.7c-.5 1.3-1.1 2.3-2 3-1 .8-2.2 1.2-3.7 1.3l-.3-2a5 5 0 0 0 2.2-.7l.5-.5-3.6-11.6h3l2.1 8.6 2.2-8.6h3l-3.4 10.5z" />

    </svg>
  );
}
