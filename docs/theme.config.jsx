import { useRouter } from "next/router";
import { useConfig } from "nextra-theme-docs";

export default {
  logo: <span>Pixeleye</span>,
  project: {
    link: "https://github.com/pixeleye-io/pixeleye",
  },
  docsRepositoryBase: "https://github.com/pixeleye-io/pixeleye/docs/pages",
  banner: {
    key: "development",
    text: (
      <a href="https://github.com/pixeleye-io/pixeleye" target="_blank">
        Pixeleye is currently in development. Click to Contribute →
      </a>
    ),
  },
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
        <meta
          property="og:url"
          content={`https://docs.pixeleye.io/${asPath}`}
        />
        <meta property="og:title" content={frontMatter.title || "Pixeleye"} />
        <meta
          property="og:description"
          content={
            frontMatter.description || "Open source Visual Regression Testing"
          }
        />
      </>
    );
  },
  footer: {
    text: (
      <span>
        AGPL-3.0-or-later {new Date().getFullYear()} ©{" "}
        <a href="https://pixeleye.io" target="_blank">
          Pixeleye
        </a>
        .
      </span>
    ),
  },
};
