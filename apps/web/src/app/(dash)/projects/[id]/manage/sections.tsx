"use client";

import { useKeyStore } from "@/stores/apiKeyStore";
import { KeyIcon } from "@heroicons/react/24/outline";
import { API } from "@/libs";
import {
  Button,
  Table,
  Input,
  DropdownMenu,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Link,
  Toggle,
  Switch,
  Label,
} from "@pixeleye/ui";
import { InputBase } from "@pixeleye/ui/src/input";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Project, UserOnProject, UserOnProjectRole } from "@pixeleye/api";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { TrashIcon } from "@heroicons/react/24/solid";
import { queries } from "@/queries";

export function SecuritySection({ id }: { id: string }) {
  const setKey = useKeyStore((state) => state.setKey);
  const apiKey = useKeyStore((state) => state.keys[id]);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [copied]);

  return (
    <div className="flex space-x-4 rounded-md border border-outline-variant p-4 overflow-hidden">
      <div className="flex flex-col justify-around flex-1 max-w-full">
        <div className="w-full flex space-x-2">
          <KeyIcon className="w-6 h-6 text-on-surface-variant" />
          <p className="whitespace-nowrap text-base pb-4">API key</p>
        </div>

        <div className="flex space-x-2 sm:items-center flex-col sm:flex-row">
          <InputBase value={apiKey || "*".repeat(24)} readOnly />
          <Button
            onClick={() => {
              if (apiKey) {
                setCopied(true);
                navigator.clipboard.writeText(apiKey);
              } else {
                API.post("/v1/projects/{id}/admin/new-token", {
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
            {apiKey ? copied ? "Copied!" : "Copy" : "Regenerate"}
          </Button>
        </div>
        <p className="text-on-surface-variant text-sm pt-2 self-start">
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
      API.delete("/v1/projects/{id}/admin", {
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
      API.delete("/v1/projects/{id}/admin/users/{userID}", {
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
    onError: (_err, _variables, context) => {
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

  const updateRole = useMutation({
    mutationFn: ({
      userID,
      role,
    }: {
      userID: string;
      role: UserOnProjectRole | "sync";
    }) =>
      API.patch("/v1/projects/{id}/admin/users/{userID}", {
        params: {
          id: project.id,
          userID,
        },
        body: {
          role: role === "sync" ? undefined : role,
          sync: role === "sync" ? true : undefined,
        },
      }),
    onMutate: async ({ userID, role }) => {
      queryClient.cancelQueries(
        queries.projects.detail(project.id)._ctx.listMembers()._ctx.git()
      );

      const old = queryClient.getQueryData(
        type === "git"
          ? queries.projects.detail(project.id)._ctx.listMembers()._ctx.git()
            .queryKey
          : queries.projects
            .detail(project.id)
            ._ctx.listMembers()
            ._ctx.invited().queryKey
      ) as UserOnProject[];

      const newMembers = old.map((member: UserOnProject) => {
        if (member.id === userID) {
          return {
            ...member,
            role: role === "sync" ? "syncing..." : role,
            roleSync: false, // we set this to false so when we are syncing, the role shows as syncing
          };
        }
        return member;
      });

      queryClient.setQueryData(
        type === "git"
          ? queries.projects.detail(project.id)._ctx.listMembers()._ctx.git()
            .queryKey
          : queries.projects
            .detail(project.id)
            ._ctx.listMembers()
            ._ctx.invited().queryKey,
        newMembers
      );

      return {
        old,
      };
    },
    onError: (_err, _variables, context) => {
      console.log(_err, _variables, context);
      queryClient.setQueryData(
        queries.projects.detail(project.id)._ctx.listMembers()._ctx.git()
          .queryKey,
        context?.old
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries(
        queries.projects.detail(project.id)._ctx.listMembers()._ctx.git()
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
      <Table.Header>
        <Table.Row>
          <Table.Head>Name</Table.Head>
          <Table.Head>Role</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {members.data?.map((member) => {
          const memberRole = member.roleSync
            ? `Synced (${member.role.charAt(0).toUpperCase() +
            member.role.slice(1).toLowerCase()
            })`
            : member.role.charAt(0).toUpperCase() +
            member.role.slice(1).toLowerCase();

          return (
            <Table.Row key={member.id}>
              <Table.Cell className="flex flex-col">
                <span>{member.name}</span>
                <span className="text-on-surface-variant">{member.email}</span>
              </Table.Cell>
              <Table.Cell className="w-0">
                <Select
                  disabled={
                    (!["admin", "owner"].includes(project.role || "") &&
                      !["admin", "owner"].includes(project.teamRole || "")) ||
                    ["admin", "owner"].includes(member.teamRole || "")
                  }
                  value={member.role}
                  onValueChange={(role) =>
                    updateRole.mutate({
                      userID: member.id,
                      role: role as UserOnProjectRole,
                    })
                  }
                >
                  <SelectTrigger className="">
                    <SelectValue>
                      <span className="whitespace-nowrap px-2">
                        {["admin", "owner"].includes(member.teamRole || "")
                          ? "Admin (inherited)"
                          : memberRole}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="reviewer">Reviewer</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="sync">Sync</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Table.Cell>
              {type === "invited" &&
                ["admin", "owner"].includes(
                  project.role || project.teamRole || ""
                ) && (
                  <Table.Cell className="w-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        deleteMember.mutate(member.id);
                      }}
                    >
                      <TrashIcon className="w-5 h-5 text-on-surface-variant" />
                    </Button>
                  </Table.Cell>
                )}
            </Table.Row>
          );
        })}
      </Table.Body>
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
    API.post("/v1/projects/{id}/admin/users", {
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

export function UpdateProjectSection({ project }: { project: Project }) {
  const { register, handleSubmit } = useForm<{
    name: string;
    snapshotThreshold: number;
    autoApprove: string;
  }>({
    defaultValues: {
      name: project.name,
      snapshotThreshold: project.snapshotThreshold || 0.2,
      autoApprove: project.autoApprove || "",
    },
  });

  const queryClient = useQueryClient();

  const [snapshotBlur, setSnapshotBlur] = useState<boolean>(project.snapshotBlur ?? true);

  const [threshold, setThreshold] = useState<number[]>([
    project.snapshotThreshold ?? 0.2,
  ]);


  const mutation = useMutation({
    mutationFn: (data: { name: string; snapshotThreshold: number, snapshotBlur: boolean, autoApprove: string }) =>
      API.patch("/v1/projects/{id}/admin", {
        params: {
          id: project.id,
        },
        body: data,
      }),
    onMutate: (data) => {
      queryClient.cancelQueries(queries.projects.detail(project.id));

      const old = queryClient.getQueryData(
        queries.projects.detail(project.id).queryKey
      ) as Project;

      queryClient.setQueryData(queries.projects.detail(project.id).queryKey, {
        ...old,
        ...data,
      });

      return {
        old,
      };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(
        queries.projects.detail(project.id).queryKey,
        context?.old
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries(queries.projects.detail(project.id));
    },
  });

  const onSubmit = handleSubmit(({ name, autoApprove }) =>
    mutation.mutate({ name, snapshotThreshold: threshold[0], snapshotBlur, autoApprove })
  );



  return (
    <form onSubmit={onSubmit} className="flex flex-col space-y-8 mt-8">
      <Input
        label="Project name"
        placeholder="Project name"
        required
        {...register("name", { required: true })}
      />
      <div>
        <Input
          label="Auto approve branches"
          placeholder="e.g. ^main$"
          {...register("autoApprove", { required: false })}
        />
        <p className="text-on-surface-variant text-sm pt-2">
          Regex expression of branches where snapshots are automatically approved. <br /> It&apos;s generally a good idea to auto approve your main branch
        </p>
      </div>
      <div className="flex flex-col">
        <label className="pb-2">
          Snapshot threshold: {threshold[0]}
        </label>
        <Slider
          value={threshold}
          onValueChange={setThreshold}
          {...register("snapshotThreshold", { min: 0, max: 1 })}
          name="snapshotThreshold"
          step={0.01}
          min={0}
          max={1}
        />
        <p className="text-on-surface-variant text-sm pt-2">
          Controls the sensitivity of diffs{" "}
          <Link
            className="!text-sm"
            href="https://pixeleye.io/docs/features/diff-highlighting#threshold"
            target="_blank"
          >
            Learn more
          </Link>
          . Recommended: 0.05{" "}
        </p>
      </div>
      <div className="flex flex-col">
        <div className="flex space-x-2 items-center">
          <Label className="pr-2">
            Snapshot blur
          </Label>
          <Switch checked={snapshotBlur} onCheckedChange={setSnapshotBlur} />
        </div>

        <p className="text-on-surface-variant text-sm pt-2">
          Temporary blur when comparing snapshots. <Link className="!text-sm"
            href="https://pixeleye.io/docs/features/diff-highlighting#blur"
            target="_blank">Learn more</Link>. Recommended: Disabled
        </p>

      </div>
      <div>
        <Button className="grow-0" loading={mutation.isPending} type="submit">
          Update
        </Button>
      </div>
    </form>
  );
}
