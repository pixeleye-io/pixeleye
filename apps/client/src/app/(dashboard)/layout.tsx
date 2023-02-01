import { redirect } from "next/navigation";
import { authOptions } from "@pixeleye/auth";
import { getServerSession } from "next-auth";
import { Header } from "./header";
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

  return (
    <>
      <NavBar />
      <Header />
      <main className="h-[200vh]">{children}</main>
    </>
  );
}
