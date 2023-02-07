import SourceCard, { ConnectionCardProps } from "./sourceCard";

const sources: Omit<ConnectionCardProps, "connected">[] = [
  {
    name: "Github",
    description: "Keep your projects in sync with your Github repositories",
    href: "https://github.com/apps/pixeleye-io/installations/new",
    imageUrl: {
      light: "/github-mark.svg",
      dark: "/github-mark-white.svg",
    },
  },
];

export default function TeamsSettingPage() {
  return (
    <>
      <div className="pb-8">
        <h1 className="text-3xl">Connections Setting Page</h1>
        <p className="text-neutral-300">
          Connect Pixeleye to your services to ensure you get the most out of
          our product
        </p>
      </div>
      <div>
        <ul
          role="list"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3"
        >
          {sources.map((source) => (
            <SourceCard key={source.name} {...source} connected={true} />
          ))}
        </ul>
      </div>
    </>
  );
}
