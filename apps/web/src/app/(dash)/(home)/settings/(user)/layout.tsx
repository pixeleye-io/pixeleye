import { env } from "@/env";
import { SidebarNav, SidebarNavLink } from "@pixeleye/ui";
import { ReactNode } from "react";

let items: SidebarNavLink[] = [
  {
    href: "/settings",
    title: "Profile",
  },
  {
    href: "/settings/account",
    title: "Account",
  },
];

if (env.NEXT_PUBLIC_PIXELEYE_HOSTING === "true") {
  items = [
    ...items.slice(0, 1),
    {
      href: "/settings/referrals",
      title: "Referrals",
    },
    ...items.slice(1),
  ]
}

export default function RootSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 mt-20">
        <aside className=" lg:w-1/5">
          <SidebarNav items={items} />
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </>
  );
}
