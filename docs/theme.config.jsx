import { useRouter } from "next/router";
import { useConfig } from "nextra-theme-docs";

export default {
  logo: <span>Pixeleye</span>,
  project: {
    link: "https://github.com/pixleye-io/pixleye",
  },
  docsRepositoryBase: "https://github.com/pixleye-io/pixleye/docs/pages",

  useNextSeoProps() {
    const { asPath } = useRouter();
    if (asPath !== "/") {
      return {
        titleTemplate: "%s – Pixeleye",
      };
    }
  },
  head: () => {
    const { asPath } = useRouter();
    const { frontMatter } = useConfig();
    return (
      <>
        <meta property="og:url" content={`https://my-app.com${asPath}`} />
        <meta property="og:title" content={frontMatter.title || "Nextra"} />
        <meta
          property="og:description"
          content={frontMatter.description || "The next site builder"}
        />
      </>
    );
  },
  footer: {
    text: (
      <span>
        AGPL-3.0-or-later {new Date().getFullYear()} ©{" "}
        <a href="https://nextra.site" target="_blank">
          Pixeleye
        </a>
        .
      </span>
    ),
  },
};
