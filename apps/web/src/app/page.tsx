import { frontend } from "./(auth)/utils";
import { headers, cookies } from "next/headers";

export default async function Home() {
  const { data: session } = await frontend.toSession({
    cookie: headers().get("cookie") || undefined,
  });

  frontend.exchangeSessionToken


  console.log("session", session);

  console.log(cookies().getAll());

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24"></main>
  );
}
