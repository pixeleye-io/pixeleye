interface PanelHeaderProps {
  title: string;
}

export function PanelHeader({ title }: PanelHeaderProps) {
  return (
    <header className="flex w-full">
      <h3 className="font-medium text-md">{title}</h3>
    </header>
  );
}
