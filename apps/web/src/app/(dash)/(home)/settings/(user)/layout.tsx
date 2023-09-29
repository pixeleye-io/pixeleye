import { SidebarNav, SidebarNavLink } from "@pixeleye/ui";
import { ReactNode } from "react";

const items: SidebarNavLink[] = [
  {
    href: "/settings",
    title: "Account",
  },
  {
    href: "/settings/security",
    title: "Security",
  },
];

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
