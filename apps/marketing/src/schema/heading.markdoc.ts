import { nodes, Node, Config } from "@markdoc/markdoc";

function generateID(children: any, attributes: any) {
  if (attributes.id && typeof attributes.id === "string") {
    return attributes.id;
  }
  return children
    .filter((child: any) => typeof child === "string")
    .join(" ")
    .replace(/[?]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

const Heading = {
  ...nodes.heading,
  transform(node: Node, config: Config) {
    const base = nodes.heading.transform?.(node, config) as any;
    base.attributes.id = generateID(base.children, base.attributes);
    return base;
  },
};

export default Heading;
