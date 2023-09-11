import { API } from "@/libs";
import { SettingsTemplate } from "../../settingsTemplate";
import { getTeam } from "@/serverLibs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@pixeleye/ui";

export default async function OrgMemberSettings({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const [team, users] = await Promise.all([
    getTeam(searchParams),
    API.get("/teams/{teamID}/users", {
      params: {
        teamID: searchParams.team,
      },
      headers: {
        cookie: cookies().toString(),
      },
    }),
  ]);

  if (team.type === "user") {
    redirect("/settings");
  }

  console.log(users);

  return (
    <>
      <SettingsTemplate
        title={"Members"}
        description="List of team members either manually invited or synced from your VCS provider."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="flex flex-col">
                  <span>{member.name}</span>
                  <span className="text-on-surface-variant">
                    {member.email}
                  </span>
                </TableCell>
                <TableCell>{member.role}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SettingsTemplate>
    </>
  );
}
