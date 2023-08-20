import { ReactNode } from "react";

export interface TemplateProps {
  children: ReactNode;
  actions?: ReactNode;
}

export function Template({ children, actions }: TemplateProps) {
  return (
    <main>
      {actions && (
        <header className="flex justify-end mx-4 mt-8 space-x-4">
          {actions}
        </header>
      )}
      <div className="mt-8">{children}</div>
    </main>
  );
}
