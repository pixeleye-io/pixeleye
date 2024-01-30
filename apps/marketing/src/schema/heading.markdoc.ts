import { nodes, Node, Config } from "@markdoc/markdoc";
import { useRef } from "react";
import { HeadingComponent } from "./heading";

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

    if (base.name === "h1") {
      return base;
    }

    return HeadingComponent({
      ...base.attributes,
      level: base.name.replace("h", ""),
      children: base.children,
    });
  },
};

export default Heading;
