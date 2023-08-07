import { Container } from "@pixeleye/ui";
import { Section, DocsNavDesktop, DocsNavMobile } from "./docsNav";
import { getAllFiles } from "./utils";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const files = await getAllFiles();

  const sections = files.reduce((acc, { url }) => {
    const [section, link] = url.split("\\", 2);
    const sectionIndex = acc.findIndex(
      (s) => s.title === section.replaceAll("-", " ")
    );

    const linkObj = {
      title: link.replaceAll("-", " "),
      href: `/docs/${url.replaceAll("\\", "/")}`,
    };

    if (sectionIndex === -1) {
      return [
        ...acc,
        {
          title: section.replaceAll("-", " "),
          links: [linkObj],
        },
      ];
    }

    return [
      ...acc.slice(0, sectionIndex),
      {
        ...acc[sectionIndex],
        links: [...acc[sectionIndex].links, linkObj],
      },
      ...acc.slice(sectionIndex + 1),
    ];
  }, [] as Section[]);

  return (
    <Container>
      <div className="relative mx-auto flex w-full flex-auto justify-center sm:px-2 md:px-8 xl:px-12">
        <div className="md:hidden">
          <DocsNavMobile sections={sections} />
        </div>
        <div className="hidden md:relative md:block md:flex-none">
          <div className="sticky top-16 -ml-0.5 h-[calc(100vh-4.75rem)] md:w-56 lg:w-64 overflow-y-auto overflow-x-hidden py-16 pl-0.5 pr-8 xl:w-72 xl:pr-16">
            <DocsNavDesktop sections={sections} />
          </div>
        </div>
        <div className="min-w-0 max-w-2xl flex-auto px-4 py-16 lg:pl-8 lg:pr-0 xl:px-16 h-full">
          {children}
        </div>
        <div className="hidden xl:sticky xl:top-16 xl:-mr-6 xl:block xl:h-[calc(100vh-4.75rem)] xl:flex-none xl:overflow-y-auto xl:py-16 xl:pr-6">
          <nav aria-labelledby="on-this-page-title" className="w-56">
            Sidebar
          </nav>
        </div>
      </div>
    </Container>
  );
}
