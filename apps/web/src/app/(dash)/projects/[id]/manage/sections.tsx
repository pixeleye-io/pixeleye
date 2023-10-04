"use client";

import { useKeyStore } from "@/stores/apiKeyStore";
import { KeyIcon } from "@heroicons/react/24/outline";
import { API } from "@/libs";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
} from "@pixeleye/ui";
import { InputBase } from "@pixeleye/ui/src/input";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Project, UserOnProject } from "@pixeleye/api";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { TrashIcon } from "@heroicons/react/24/solid";
import { queries } from "@/queries";

export function SecuritySection({ id }: { id: string }) {
  const setKey = useKeyStore((state) => state.setKey);
  const apiKey = useKeyStore((state) => state.keys[id]);

  return (
    <div className="flex space-x-4 rounded-md border border-outline-variant p-4 overflow-hidden">
      <div className="flex flex-col max-w-[10rem] items-center space-between">
        <KeyIcon className="w-12 h-12 text-on-surface-variant" />
        <p className="rounded-full border border-outline-variant whitespace-nowrap text-xs px-2 py-1">
          API key
        </p>
      </div>
      <div className="flex flex-col justify-around flex-1 max-w-full">
        <div className="flex space-x-2 sm:items-center flex-col sm:flex-row">
          <InputBase value={apiKey || "*".repeat(24)} readOnly />
          <Button
            onClick={() => {
              if (apiKey) {
                navigator.clipboard.writeText(apiKey);
              } else {
                API.post("/projects/{id}/admin/new-token", {
                  params: {
                    id,
                  },
                }).then((project) => {
                  setKey(project.id, project.token!);
                });
              }
            }}
            variant="secondary"
            className="shrink-0 mt-2 sm:mt-0 !ml-auto sm:!ml-2"
          >
            {apiKey ? "Copy" : "Regenerate"}
          </Button>
        </div>
        <p className="text-on-surface-variant text-sm">
          Make sure you keep this safe. Learn more about how to use this in our
          docs.
        </p>
      </div>
    </div>
  );
}

export function DeleteProjectSection({ project }: { project: Project }) {
  const router = useRouter();
  const { mutate: deletedProject } = useMutation({
    mutationFn: () =>
      API.delete("/projects/{id}/admin", {
        params: { id: project.id },
        body: {
          name: project.name,
        },
      }),
    onMutate: () => {
      router.push("/dashboard");
    },
  });

  return (
    <div className="flex flex-col">
      <p className="text-on-surface-variant">
        Deleting a project is permanent. All snapshots and data will be deleted.
      </p>
      <Button
        variant="destructive"
        className="mt-4 w-fit"
        onClick={() => {
          deletedProject();
        }}
      >
        Delete Project
      </Button>
    </div>
  );
}

export function MemberSection({
  project,
  type,
}: {
  project: Project;
  type: "invited" | "git";
}) {
  const queryClient = useQueryClient();

  const invitedMembers = useQuery(
    queries.projects.detail(project.id)._ctx.listMembers()._ctx.invited()
  );

  const gitMembers = useQuery(
    queries.projects.detail(project.id)._ctx.listMembers()._ctx.git()
  );

  const deleteMember = useMutation({
    mutationFn: (userID: string) =>
      API.delete("/projects/{id}/admin/users/{userID}", {
        params: {
          id: project.id,
          userID,
        },
      }),

    onMutate: (userID) => {
      queryClient.cancelQueries(
        queries.projects.detail(project.id)._ctx.listMembers()
      );

      const old = queryClient.getQueryData(
        queries.projects.detail(project.id)._ctx.listMembers()._ctx.git()
          .queryKey
      ) as UserOnProject[];

      const newMembers = old.filter((member: UserOnProject) => {
        return member.id !== userID;
      });

      queryClient.setQueryData(
        queries.projects.detail(project.id)._ctx.listMembers()._ctx.git()
          .queryKey,
        newMembers
      );

      return {
        old,
      };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        queries.projects.detail(project.id)._ctx.listMembers()._ctx.git()
          .queryKey,
        context?.old
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries(
        queries.projects.detail(project.id)._ctx.listMembers()
      );
    },
  });

  const members = type === "invited" ? invitedMembers : gitMembers;

  if (members.isLoading) {
    // TODO loading state
    return null;
  }

  if (members.data?.length === 0) {
    return (
      <div>
        <p>
          {type === "invited"
            ? "No members have been invited to this project"
            : "No members have access to this project via your VCS"}
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.data?.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="flex flex-col">
              <span>{member.name}</span>
              <span className="text-on-surface-variant">{member.email}</span>
            </TableCell>
            <TableCell>{member.role}</TableCell>
            {type === "invited" &&
              ["admin", "owner"].includes(
                project.role || project.teamRole || ""
              ) && (
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      deleteMember.mutate(member.id);
                    }}
                  >
                    <TrashIcon className="w-5 h-5 text-on-surface-variant" />
                  </Button>
                </TableCell>
              )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface InviteMembersForm {
  email: string;
}

export function InviteMemberSection({ project }: { project: Project }) {
  const { handleSubmit, register, formState, reset } =
    useForm<InviteMembersForm>();

  const onSubmit = handleSubmit(({ email }) =>
    API.post("/projects/{id}/admin/users", {
      params: {
        id: project.id,
      },
      body: {
        email,
        role: "viewer",
      },
    })
  );

  useEffect(() => {
    reset();
  }, [formState.isSubmitSuccessful, reset]);

  return (
    <div>
      <form onSubmit={onSubmit} className="flex items-end space-x-4 mt-8">
        <Input
          label="Invite user by email"
          placeholder="Email"
          type="email"
          required
          {...register("email", { required: true })}
        />
        <Button loading={formState.isSubmitting} type="submit">
          Invite
        </Button>
      </form>
      <p className="text-on-surface-variant text-sm pt-2">
        We&apos;ll send an email with instructions on how to join
      </p>
    </div>
  );
}

function EmptyMembersState() {}
