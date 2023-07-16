// import { getUser } from "@pixeleye/github";
import Link from "next/link";

export default async function DashboardPage() {
  // const auth = await getUser(32960904);

  // const testing = await fetch("https://api.github.com/user/32960904", {
  //   headers: {
  //       Authorization: `token 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`,
  //   },
  // })

  // console.log(auth);

  // console.log("testing", testing.headers);

  return (
    <main className="">
      <h1>Dashboard</h1>
      <Link href="/add">Add Project</Link>
    </main>
  );
}
