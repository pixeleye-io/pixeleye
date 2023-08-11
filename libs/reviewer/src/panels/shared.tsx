interface PanelHeaderProps {
  title: string;
}

export function PanelHeader({ title }: PanelHeaderProps) {
  return (
    <header className="flex w-full">
      <h3 className="font-medium text-lg">{title}</h3>
    </header>
  );
}
