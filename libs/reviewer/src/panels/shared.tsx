import { cx } from "class-variance-authority";

interface PanelHeaderProps {
  title: string;
  className?: string;
}

export function PanelHeader({ title, className }: PanelHeaderProps) {
  return (
    <header className={cx("flex w-full", className)}>
      <h3 className="font-medium text-md">{title}</h3>
    </header>
  );
}
