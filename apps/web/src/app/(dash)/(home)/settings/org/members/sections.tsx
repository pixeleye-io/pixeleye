"use client";

import { API } from "@/libs";
import {
  Button,
  Table,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pixeleye/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Team, UserOnTeam, UserOnTeamRole } from "@pixeleye/api";
import { TrashIcon } from "@heroicons/react/24/solid";
import { queries } from "@/queries";

export function MemberSection({
  team,
  type,
}: {
  team: Team;
  type: "invited" | "git";
}) {
  const queryClient = useQueryClient();

  const invitedMembers = useQuery(
    queries.teams.detail(team.id)._ctx.listMembers()._ctx.invited()
  );

  const gitMembers = useQuery(
    queries.teams.detail(team.id)._ctx.listMembers()._ctx.git()
  );

  const deleteMember = useMutation({
    mutationFn: (userID: string) =>
      API.delete("/v1/teams/{teamID}/admin/users/{userID}", {
        params: {
          teamID: team.id,
          userID,
        },
      }),

    onMutate: (userID) => {
      queryClient.cancelQueries(
        queries.teams.detail(team.id)._ctx.listMembers()
      );

      const old = queryClient.getQueryData(
        queries.teams.detail(team.id)._ctx.listMembers()._ctx.git().queryKey
      ) as UserOnTeam[];

      const newMembers = old.filter((member: UserOnTeam) => {
        return member.id !== userID;
      });

      queryClient.setQueryData(
        queries.teams.detail(team.id)._ctx.listMembers()._ctx.git().queryKey,
        newMembers
      );

      return {
        old,
      };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(
        queries.teams.detail(team.id)._ctx.listMembers()._ctx.git().queryKey,
        context?.old
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries(
        queries.teams.detail(team.id)._ctx.listMembers()
      );
    },
  });

  const updateRole = useMutation({

    mutationFn: ({ userID, role }: { userID: string; role: UserOnTeamRole | "sync" }) => API.patch("/v1/teams/{teamID}/admin/users/{userID}", {
      params: {
        teamID: team.id,
        userID,
      },
      body: {
        role: role === "sync" ? undefined : role,
        sync: role === "sync" ? true : undefined,
      },
    }),


    onMutate: ({ userID, role }) => {
      queryClient.cancelQueries(
        queries.teams.detail(team.id)._ctx.listMembers()
      );

      const old = queryClient.getQueryData(
        queries.teams.detail(team.id)._ctx.listMembers()._ctx.git().queryKey
      ) as UserOnTeam[];

      const newMembers = old.map((member: UserOnTeam) => {
        if (member.id === userID) {
          return {
            ...member,
            role: role === "sync" ? "syncing..." : role,
          };
        }
        return member;
      });

      queryClient.setQueryData(
        queries.teams.detail(team.id)._ctx.listMembers()._ctx.git().queryKey,
        newMembers
      );

      return {
        old,
      };
    },

    onError: (_err, _, context) => {
      queryClient.setQueryData(
        queries.teams.detail(team.id)._ctx.listMembers()._ctx.git().queryKey,
        context?.old
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries(
        queries.teams.detail(team.id)._ctx.listMembers()
      );
    },

  });


  const members = type === "invited" ? invitedMembers : gitMembers;

  if (members.isLoading) {
    return null;
  }

  if (members.data?.length === 0) {
    return (
      <div>
        <p>
          {type === "invited"
            ? "No members have been invited to this team"
            : "No members have access to this team via your VCS"}
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
        {members.data?.map((member) => (
          <Table.Row key={member.id}>
            <Table.Cell className="flex flex-col">
              <span>{member.name}</span>
              <span className="text-on-surface-variant">{member.email}</span>
            </Table.Cell>
            <Table.Cell>
              <Select
                disabled={
                  !["owner", "admin"].includes(team.role || "") ||
                  member.role === "owner" ||
                  member.role === "admin" && team.role !== "owner"
                }
                value={member.role}
                onValueChange={(role) =>
                  updateRole.mutate({
                    userID: member.id,
                    role: role as UserOnTeamRole,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue className="whitespace-nowrap px-2 first-letter:uppercase">
                    {member.roleSync ? `${member.role} (Synced)` : member.role}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    {type === "git" && (<SelectItem value="sync">Sync</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select></Table.Cell>
            {type === "invited" && ["admin", "owner"].includes(team.role || "") && (
              <Table.Cell>
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
        ))}
      </Table.Body>
    </Table >
  );
}
