"use client";
import { Button } from "@pixeleye/ui";
import { API } from "@pixeleye/api";
import Link from "next/link";

export default function DashboardPage() {
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
      <Button
        onClick={() => {
          API.post("/projects", {
            body: {
              name: "Test",
              source: "github" as any,
              sourceID: "32960904",
            },
          });
        }}
      >
        Test
      </Button>
    </main>
  );
}
