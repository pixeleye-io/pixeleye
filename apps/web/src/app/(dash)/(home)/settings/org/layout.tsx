import { ReactNode } from "react";
import { OrgSidebar } from "./orgSidebar";

export default function RootSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 mt-4 md:mt-20">
        <aside className=" lg:w-1/5">
          <OrgSidebar />
        </aside>
        <main className="flex-1 space-y-4">{children}</main>
      </div>
    </>
  );
}
