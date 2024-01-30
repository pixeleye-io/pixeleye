import { Container, ScrollArea } from "@pixeleye/ui";
import { Section, DocsNavDesktop, DocsNavMobile } from "./[...pages]/docsNav";
import { getFiles } from "./[...pages]/utils";




export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const sections = await getFiles();

  return (
    <Container>
      <div className="relative mx-auto flex w-full flex-auto justify-center sm:px-2 md:px-8">
        <div className="md:hidden">
          <DocsNavMobile sections={sections} />
        </div>
        <div className="hidden md:relative md:block md:flex-none">
          <div className="sticky top-[4.5rem] border-r border-outline-variant md:w-56 lg:w-60 ">
            <ScrollArea className="h-[calc(100vh-4.5rem)] overflow-x-hidden -ml-0.5 py-16 pl-0.5 ">
              <DocsNavDesktop sections={sections} />
            </ScrollArea>
          </div>

        </div>
        {children}
      </div>
    </Container>
  );
}
