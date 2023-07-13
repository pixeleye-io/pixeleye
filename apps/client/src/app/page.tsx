import API from "@pixeleye/api";
import Image from "next/image";
import { frontend } from "./(auth)/utils";
import { headers } from "next/headers";

export default async function Home() {
  const { data: session } = await frontend.toSession({
    cookie: headers().get("cookie") || undefined,
  });

  console.log(session);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24"></main>
  );
}
