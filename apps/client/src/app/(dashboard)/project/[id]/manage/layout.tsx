import { Container } from "@pixeleye/ui";
import SettingsLayout from "~/components/settingsLayout";

const navigation = (id: string) => [
  { name: "General", href: `/project/${id}/manage` },
  { name: "Access", href: `/project/${id}/manage/access` },
];

export default function ProjectManageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <>
      <div className="px-4 pt-12 pb-6">
        <Container>
          <h1 className="text-4xl">Manage project</h1>
        </Container>
      </div>
      <SettingsLayout navigation={navigation(params.id)}>
        {children}
      </SettingsLayout>
    </>
  );
}
