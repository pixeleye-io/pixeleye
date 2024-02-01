import { Fence } from "@pixeleye/ui/src/fence";
import { Node } from "@markdoc/markdoc";

const FenceComponent = {
  render: (node: Node) => {
    return Fence(node as any);
  },
  transform: (node: Node) => {
    console.log(node);
    return node;
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
