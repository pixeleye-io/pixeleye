import API from "@pixeleye/api";
import { cookies } from "next/headers";
import { Navbar } from "./navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await API.get("/user/me", {
    headers: {
      cookie: cookies().toString(),
    },
  });

  return (
    <>
      <Navbar user={user} />
      {children}
    </>
  );
}
