import { Node } from "@markdoc/markdoc";

import { Code as CodeComponent } from "@pixeleye/ui";

const Code = {
  attributes: {
    content: { type: String, render: false, required: true },
  },
  transform(node: Node) {
    return CodeComponent({
      children: [node.attributes.content],
    });
  },
};

export default Code;
