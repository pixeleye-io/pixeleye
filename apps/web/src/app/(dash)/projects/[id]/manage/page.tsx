import { Button } from "@pixeleye/ui";
import { FormEventHandler } from "react";
import { SecuritySection } from "./sections";

function Section({
  children,
  title,
  description,
  onSubmit,
  form,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  form?: boolean;
}) {
  const Comp = form ? "form" : "div";
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
      <div className="px-4 sm:px-0">
        <h2 className="text-base font-semibold leading-7 text-on-surface">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-on-surface-variant">
          {description}
        </p>
      </div>

      <Comp {...((form ? { onSubmit } : {}) as any)} className="md:col-span-2">
        <div className="px-4 py-6 sm:p-8">{children}</div>
        {form && (
          <div className="flex items-center justify-end gap-x-6 border-t border-outline-variant px-4 py-4 sm:px-8">
            <Button type="submit">Save</Button>
          </div>
        )}
      </Comp>
    </div>
  );
}

export default function Page({ params }: { params: { id: string }}) {
  const projectId = params.id;
  return (
    <div className="space-y-10 divide-y divide-outline mt-12">
      <Section
        title="Security"
        description="The API token is used by our clients to upload the snapshot. Keep this safe"
      >
        <SecuritySection id={projectId} />
      </Section>
    </div>
  );
}
