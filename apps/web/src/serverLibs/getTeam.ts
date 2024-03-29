import { Team } from "@pixeleye/api";
import { API } from "@/libs";
import { cookies } from "next/headers";

export async function getTeam(searchParams: { team?: string }): Promise<Team> {
  const teams = await API.get("/v1/user/teams", {
    headers: {
      cookie: cookies().toString(),
    },
  });

  if (searchParams.team) {
    const team = teams.find((team) => team.id === searchParams.team);
    if (team) {
      return team;
    }
  }

  return teams.find((team) => team.role === "owner" && team.type === "user")!;
}
