import { ReactNode } from "react";

export interface CodeProps {
    children: ReactNode;
    content?: string;
}

export default function Code({ children, content }: CodeProps) {
    return (
        <code className="not-prose bg-tertiary/10 text-tertiary px-1 py-0.5 rounded">
            {children || content}
        </code>
    );
}