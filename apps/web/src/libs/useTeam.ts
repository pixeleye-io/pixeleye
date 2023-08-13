import { queries } from "@/queries";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

export function useTeam() {
  const params = useSearchParams();

  const teamID = params.get("team");

  const { data: teams, isLoading } = useQuery(queries.teams.list());

  if (isLoading || !teams) {
    return { isLoading, team: undefined };
  }

  if (teamID) {
    const team = teams.find((team) => team.id === teamID);

    if (team) {
      return { team, isLoading };
    }
  }

  return {
    team: teams.find((team) => team.role === "owner" && team.type === "user")!,
    isLoading,
  };
}
