import type { Node } from "@markdoc/markdoc";
import { Markdoc } from "@astrojs/markdoc/config";

const FenceComponent = {
  attributes: {},
  transform: (node: Node) => {
    const lang = node.attributes.language.split(".").at(-1);
    const code = node.attributes.content;
    const title =
      node.attributes.language === "bash"
        ? "Terminal"
        : node.attributes.language;

    return new Markdoc.Tag("fence", { lang, code, title }, []);
  },
};

export default FenceComponent;
