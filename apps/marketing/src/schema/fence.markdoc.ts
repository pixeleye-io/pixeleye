import { Fence } from "@pixeleye/ui/src/fence";
import { Node } from "@markdoc/markdoc";

const FenceComponent = {
  transform: (node: Node) => {
    return Fence({
      language: node.attributes.language.split(".").at(-1),
      children: node.attributes.content,
      title:
        node.attributes.language === "bash"
          ? "Terminal"
          : node.attributes.language,
    });
  },
  attributes: {
    language: {
      type: String,
    },
    title: {
      type: String,
    },
  },
};

export default FenceComponent;
