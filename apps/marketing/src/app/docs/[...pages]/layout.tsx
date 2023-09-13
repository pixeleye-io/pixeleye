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
    const [section, link] = url.split("/", 2);
    const sectionIndex = acc.findIndex(
      (s) => s.title === section.replaceAll("-", " ")
    );

    const linkObj = {
      title: link.replaceAll("-", " "),
      href: `/docs/${url}`,
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
      <div className="relative mx-auto flex w-full flex-auto justify-center sm:px-2 md:px-8">
        <div className="md:hidden">
          <DocsNavMobile sections={sections} />
        </div>
        <div className="hidden md:relative md:block md:flex-none">
          <div className="sticky top-16 -ml-0.5 h-[calc(100vh-4.75rem)] border-r border-outline-variant md:w-56 overflow-y-auto overflow-x-hidden py-16 pl-0.5 lg:w-60">
            <DocsNavDesktop sections={sections} />
          </div>
        </div>
        {children}
      </div>
    </Container>
  );
}
