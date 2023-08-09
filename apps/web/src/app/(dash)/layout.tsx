import { Navbar } from "./navbar";
import { sAPI } from "@/libs";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await sAPI.get("/user/me", {});

  return (
    <>
      <Navbar user={user} />
      {children}
    </>
  );
}
