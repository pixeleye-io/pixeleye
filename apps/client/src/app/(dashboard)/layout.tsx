import { redirect } from "next/navigation";
import { authOptions } from "@pixeleye/auth";
import { getServerSession } from "next-auth";
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
      <header className="sticky top-0 z-40 py-4 bg-black/50 backdrop-blur-sm">
        Testing header
      </header>
      <main className="h-[200vh]">{children}</main>
    </>
  );
}
