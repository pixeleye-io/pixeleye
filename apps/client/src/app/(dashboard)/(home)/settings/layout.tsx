import { Container } from "@pixeleye/ui";
import SettingsLayout from "~/components/settingsLayout";

const navigation = [
  { name: "General", href: "/settings" },
  { name: "Connections", href: "/settings/connections" },
  { name: "Billing", href: "/settings/billing" },
  { name: "Notifications", href: "/settings/notifications" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="px-4 py-12 border-b border-neutral-300 dark:border-neutral-700">
        <Container>
          <h1 className="text-4xl">User account settings</h1>
        </Container>
      </div>
      <SettingsLayout navigation={navigation}>{children}</SettingsLayout>
    </>
  );
}
