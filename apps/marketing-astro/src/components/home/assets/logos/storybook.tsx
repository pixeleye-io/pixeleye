import { LogoProps } from "./types";


export function StorybookLogo({ className }: LogoProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={className}
            aria-label="Storybook Logo"
            fill="currentColor"
        >
            <path d="M16.3.2V3a.2.2 0 0 0 .2.1l1-.8 1 .7a.2.2 0 0 0 .2-.1V0L20 0a1.2 1.2 0 0 1 1.3 1.2v21.6A1.2 1.2 0 0 1 20 24l-16.1-.7A1.2 1.2 0 0 1 2.7 22L2 2.3a1.2 1.2 0 0 1 1.1-1.2L16.3.2zm-3 9.1c0 .5 3.1.2 3.6 0 0-3.3-1.8-5-4.9-5-3.1 0-4.9 1.8-4.9 4.3 0 4.5 6 4.6 6 7 0 .7-.3 1-1 1-1 0-1.4-.4-1.4-2 0-.4-3.6-.6-3.7 0-.3 4 2.2 5.1 5 5.1 2.9 0 5-1.5 5-4.2 0-4.7-6-4.6-6-7 0-1 .7-1 1-1 .5 0 1.3 0 1.3 1.8z" />
        </svg>
    );
}
