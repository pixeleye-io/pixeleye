export interface SettingsTemplateProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export function SettingsTemplate({
  children,
  title,
  description,
}: SettingsTemplateProps) {
  return (
    <div className="grid grid-cols-1 gap-y-4 py-4">
      <div className="px-4 sm:px-0">
        <h2 className="text-base font-semibold leading-7 text-on-surface">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-on-surface-variant">
          {description}
        </p>
      </div>

      <div className="bg-surface">{children}</div>
    </div>
  );
}
