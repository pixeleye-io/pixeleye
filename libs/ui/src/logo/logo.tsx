import { useId } from "react";

interface LogoProps {
    className?: string;
    height?: number;
    width?: number;
}

export default function Logo(props: LogoProps) {
    const maskId = useId();
    return (
        <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            {...props}
        >
            <defs>
                <mask id={maskId}>
                    <rect width="24" height="24" fill="#fff" />
                    <path d="M12 9A1 1 0 0114.5 9 1 1 0 0112 9" fill="#000" />
                </mask>
            </defs>
            <path
                mask={`url(#${maskId})`}
                d="M2 22V15Q2 2 15 2L14 5.5Q5.5 5.5 5.5 15V22ZM22 2Q22 17 9 17L10 13.5Q18.5 13.5 18.5 2ZM9.5 9.5A1 1 0 0014.5 9.5 1 1 0 009.5 9.5"
                fill="currentColor"
            />
        </svg>
    );
}