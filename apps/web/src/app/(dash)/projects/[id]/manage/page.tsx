import { Button } from "@pixeleye/ui";
import { FormEventHandler } from "react";
import {
  DeleteProjectSection,
  MemberSection,
  SecuritySection,
} from "./sections";
import { API } from "@/libs";
import { cookies } from "next/headers";
import { getTeam } from "@/serverLibs";
import { UserOnProject } from "@pixeleye/api";

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

export default async function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const projectId = params.id;

  const cookie = cookies().toString();

  const [project, users, team] = await Promise.all([
    API.get("/projects/{id}", {
      params: {
        id: projectId,
      },
      headers: {
        cookie,
      },
    }),
    API.get("/projects/{id}/users", {
      params: {
        id: projectId,
      },
      headers: {
        cookie,
      },
    }),
    getTeam(searchParams),
  ]);

  const [vcsUsers, invitedUsers] = users.reduce(
    (acc, user) => {
      if (user.type === "git") {
        acc[1].push(user);
      } else {
        acc[0].push(user);
      }
      return acc;
    },
    [[], []] as [UserOnProject[], UserOnProject[]]
  );

  return (
    <div className="space-y-10 mt-12">
      <Section
        title="Security"
        description="The API token is used by our clients to upload the snapshot. Keep this safe"
      >
        <SecuritySection id={project.id} />
      </Section>
      {project.source !== "custom" && (
        <Section
          title="VCS Members"
          description={`Manage who have access to this project via ${project.source}`}
        >
          <MemberSection members={vcsUsers} project={project} />
        </Section>
      )}
      <Section
        title="VCS Members"
        description="Manage who have access to this project via "
      >
        <MemberSection members={invitedUsers} project={project} />
      </Section>
      <Section
        title="Danger zone"
        description="These actions are dangerous. Please be careful."
      >
        <DeleteProjectSection project={project} />
      </Section>
    </div>
  );
}
