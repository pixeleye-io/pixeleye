"use client";

import { API } from "@/libs";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@pixeleye/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Team, UserOnTeam } from "@pixeleye/api";
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
      API.delete("/teams/{teamID}/admin/users/{userID}", {
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
            ? "No members have been invited to this team"
            : "No members have access to this team via your VCS"}
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
            {type === "invited" && ["admin", "owner"].includes(team.role || "") && (
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
