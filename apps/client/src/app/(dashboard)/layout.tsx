import { redirect } from "next/navigation";
import { authOptions } from "@pixeleye/auth";
import { getServerSession } from "next-auth";
import { serverApi } from "~/lib/server";
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

  const teams = await serverApi(session).team.getUserTeams();

  return (
    <>
      <NavBar teams={teams} />
      {children}
    </>
  );
}
