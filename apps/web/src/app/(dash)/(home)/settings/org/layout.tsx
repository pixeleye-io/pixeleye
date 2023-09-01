import { SidebarNav, SidebarNavLink } from "@pixeleye/ui";
import { ReactNode } from "react";

const items: SidebarNavLink[] = [
  {
    href: "/settings/org",
    title: "General",
  },
  {
    href: "/settings/org/members",
    title: "Members",
  },
  {
    href: "/settings/org/advanced",
    title: "Advanced",
  },
];

export default function RootSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 mt-4 md:mt-20">
        <aside className=" lg:w-1/5">
          <SidebarNav items={items} />
        </aside>
        <main className="flex-1 space-y-4">{children}</main>
      </div>
    </>
  );
}
