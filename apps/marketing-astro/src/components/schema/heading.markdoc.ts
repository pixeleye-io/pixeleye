import Markdoc, { type Config, type Node } from "@markdoc/markdoc";

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
  ...Markdoc.nodes.heading,
  transform(node: Node, config: Config) {
    const base = Markdoc.nodes.heading.transform?.(node, config) as any;
    base.attributes.id = generateID(base.children, base.attributes);

    if (base.name === "h1") {
      return base;
    }

    base.attributes.level = base.name.replace("h", "");
    return base;
  },
};

export default Heading;
