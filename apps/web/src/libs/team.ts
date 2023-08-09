import { Team } from "@pixeleye/api";
import { sAPI } from "./api-server";

export async function getTeam(searchParams: { team?: string }): Promise<Team> {
  const teams = await sAPI.get("/user/teams", {});

  if (searchParams.team) {
    const team = teams.find((team) => team.id === searchParams.team);
    if (team) {
      return team;
    }
  }

  return teams.find((team) => team.role === "owner" && team.type === "user")!;
}
