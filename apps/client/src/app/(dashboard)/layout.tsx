import { redirect } from "next/navigation";
import { authOptions } from "@pixeleye/auth";
import { getServerSession } from "next-auth";
import { serverApi } from "~/utils/server";
import { NavBar } from "./navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // TODO - When enabled, set callback cookie here
  // Disable middleware to check if callback redirect works
  if (!session) redirect("/api/auth/signin");

  const teams = (await serverApi(session).team.getUserTeams()).map((team) => ({
    name: team.name,
    id: team.id,
    img: "/gitlab-logo.svg",
  }));

  console.log(teams);

  return (
    <>
      <NavBar teams={teams} />
      {children}
    </>
  );
}
