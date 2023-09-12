import { ReactNode } from "react";

export interface CodeProps {
    children: ReactNode;
    content?: string;
}

export default function Code({ children, content }: CodeProps) {
    return (
        <code className="not-prose bg-surface-container-high dark:bg-[#1e1e1e] p-2 rounded text-on-surface">
            {children || content}
        </code>
    );
}